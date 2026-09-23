// Explore's four questions and how a listing scores against them. The score
// ranks, it does not promise: it starts at a floor so no listing reads as 0%.
import type { PresetTrip } from "./preset-trips";

export const EXPLORE_QUESTIONS = {
  size: { label: "How many of you", options: { "2-4": "2–4", "5-8": "5–8", "9+": "9+" } },
  when: {
    label: "Roughly when",
    options: { spring: "Spring", summer: "Summer", autumn: "Autumn", any: "Not sure" },
  },
  cost: {
    label: "Each, about",
    options: { "under-500": "Under 500", "500-1000": "500–1,000", more: "More" },
  },
  pace: { label: "The pace", options: { base: "One base", move: "On the move" } },
} as const;

type Questions = typeof EXPLORE_QUESTIONS;
export type ExploreQuestion = keyof Questions;
export type ExploreAnswers = { [K in ExploreQuestion]: keyof Questions[K]["options"] } & {
  nights: number;
};

/** A ceiling, not a target: listings longer than `nights` are not matched. At `max` there is no limit. */
export const NIGHTS = { label: "Longest trip", min: 3, max: 14 } as const;

export const DEFAULT_ANSWERS: ExploreAnswers = {
  size: "5-8",
  when: "summer",
  cost: "500-1000",
  pace: "base",
  nights: 14,
};

const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

const month = (word: string) => MONTHS.indexOf(word.trim().toLowerCase()) + 1;

export function monthsOf(bestMonths: string): number[] {
  const found = new Set<number>();
  for (const part of bestMonths.split(",")) {
    const [from, to] = part.split(" to ").map(month);
    if (!from) continue;
    if (!to) {
      found.add(from);
      continue;
    }
    for (let m = from; ; m = (m % 12) + 1) {
      found.add(m);
      if (m === to) break;
    }
  }
  return [...found].sort((a, b) => a - b);
}

function trailingDigits(text: string): string {
  let start = text.length;
  while (start > 0 && text[start - 1] >= "0" && text[start - 1] <= "9") start--;
  return text.slice(start);
}

export function groupRange(groupSize: string): { min: number; max: number } | null {
  const dash = /[–-]/.exec(groupSize);
  if (!dash) return null;
  const low = trailingDigits(groupSize.slice(0, dash.index).trimEnd());
  const high = /^\d+/.exec(groupSize.slice(dash.index + 1).trimStart());
  return low && high ? { min: Number(low), max: Number(high[0]) } : null;
}

const SIZE_PROBE: Record<ExploreAnswers["size"], number> = { "2-4": 3, "5-8": 6, "9+": 10 };
const SEASON: Record<ExploreAnswers["when"], number[]> = {
  spring: [3, 4, 5],
  summer: [6, 7, 8],
  autumn: [9, 10, 11],
  any: MONTHS.map((_, i) => i + 1),
};

// Why: listings mix GBP and EUR; the bands are rough enough that minor units
// compare directly rather than pulling in a rate for a quiz.
function costFits(priceMinor: number, cost: ExploreAnswers["cost"]): boolean {
  if (cost === "under-500") return priceMinor < 50000;
  if (cost === "more") return priceMinor > 100000;
  return priceMinor >= 50000 && priceMinor <= 100000;
}

export function matchScore(trip: PresetTrip, answers: ExploreAnswers): number {
  let score = 40;
  const range = groupRange(trip.groupSize);
  const probe = SIZE_PROBE[answers.size];
  if (range && probe >= range.min && probe <= range.max) score += 20;
  if (monthsOf(trip.bestMonths).some((m) => SEASON[answers.when].includes(m))) score += 18;
  if (costFits(trip.priceFromMinor, answers.cost)) score += 14;
  const oneBase = trip.legs.filter((l) => l.kind === "base").length === 1;
  if (oneBase === (answers.pace === "base")) score += 7;
  return Math.min(score, 99);
}

export function rankMatches(
  trips: readonly PresetTrip[],
  answers: ExploreAnswers,
  count: number,
): { trip: PresetTrip; score: number }[] {
  const noLimit = answers.nights >= NIGHTS.max;
  return trips
    .filter((trip) => noLimit || trip.nights <= answers.nights)
    .map((trip) => ({ trip, score: matchScore(trip, answers) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}

/** The map shows only a region's lead listings; order in `PRESET_TRIPS` decides the lead. */
export function mapPicks(trips: readonly PresetTrip[], perRegion: number): PresetTrip[] {
  const taken = new Map<string, number>();
  return trips.filter((trip) => {
    const count = taken.get(trip.region) ?? 0;
    taken.set(trip.region, count + 1);
    return count < perRegion;
  });
}

export function readAnswers(value: unknown): ExploreAnswers | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const out: Record<string, string | number> = {};
  for (const key of Object.keys(EXPLORE_QUESTIONS) as ExploreQuestion[]) {
    const pick = raw[key];
    if (typeof pick !== "string" || !(pick in EXPLORE_QUESTIONS[key].options)) return null;
    out[key] = pick;
  }
  // Answers saved before the slider existed read with the default length.
  const nights = raw.nights ?? DEFAULT_ANSWERS.nights;
  if (typeof nights !== "number" || !Number.isInteger(nights) || nights < NIGHTS.min || nights > NIGHTS.max) {
    return null;
  }
  out.nights = nights;
  return out as ExploreAnswers;
}

