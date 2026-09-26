// Why a listing fits the group, in words — never a bare score.
import {
  costFits,
  EXPLORE_QUESTIONS,
  groupRange,
  matchScore,
  monthsOf,
  NIGHTS,
  SEASON,
  SIZE_PROBE,
  type ExploreAnswers,
} from "./explore-match";
import type { PresetTrip } from "./preset-trips";

const BUDGET_TOP: Record<ExploreAnswers["cost"], number> = { "under-500": 50000, "500-1000": 100000, more: Infinity };

export function fitCheck(trip: PresetTrip, answers: ExploreAnswers): { fits: string[]; misses: string[] } {
  const fits: string[] = [];
  const misses: string[] = [];
  const range = groupRange(trip.groupSize);
  const probe = SIZE_PROBE[answers.size];
  if (range && probe >= range.min && probe <= range.max) fits.push(`Fits ${EXPLORE_QUESTIONS.size.options[answers.size]}`);
  else if (range) misses.push(`For ${range.min}–${range.max}`);

  if (answers.when !== "any") {
    if (monthsOf(trip.bestMonths).some((m) => SEASON[answers.when].includes(m))) fits.push(EXPLORE_QUESTIONS.when.options[answers.when]);
    else misses.push(`Best ${trip.bestMonths}`);
  }

  if (costFits(trip.priceFromMinor, answers.cost)) fits.push("In budget");
  else if (trip.priceFromMinor > BUDGET_TOP[answers.cost]) misses.push("Over budget");

  const pace = trip.legs.filter((l) => l.kind === "base").length === 1 ? "base" : "move";
  if (pace === answers.pace) fits.push(EXPLORE_QUESTIONS.pace.options[pace]);
  else misses.push(EXPLORE_QUESTIONS.pace.options[pace]);

  if (answers.nights < NIGHTS.max && trip.nights > answers.nights) misses.push(`${trip.nights} nights`);
  return { fits, misses };
}

const isGood = (trip: PresetTrip, answers: ExploreAnswers) => fitCheck(trip, answers).misses.length <= 1;

export function bestFits(trips: readonly PresetTrip[], answers: ExploreAnswers, count: number): PresetTrip[] {
  return trips
    .filter((t) => isGood(t, answers) && (answers.nights >= NIGHTS.max || t.nights <= answers.nights))
    .map((trip) => ({ trip, score: matchScore(trip, answers) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((x) => x.trip);
}

export function goodFitCount(trips: readonly PresetTrip[], answers: ExploreAnswers): number {
  return trips.filter((t) => isGood(t, answers)).length;
}
