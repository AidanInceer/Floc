// Explore's sliders: group size, a window of months, a price band and a
// longest trip. The web reads these; the phone still reads the band answers,
// so a saved filter carries its band answers alongside.
import { groupRange, monthsOf, NIGHTS, readAnswers, SEASON, SIZE_PROBE, type ExploreAnswers } from "./explore-match";
import type { PresetTrip } from "./preset-trips";

export type ExploreFilter = {
  people: number;
  fromMonth: number;
  toMonth: number;
  /** Major units. */
  priceMin: number;
  priceMax: number;
  nights: number;
};

/** At `people.max` the group is that many or more; at `price.max` there is no ceiling. */
export const FILTER = {
  people: { min: 2, max: 12 },
  month: { min: 1, max: 12 },
  price: { min: 0, max: 2000, step: 100 },
  nights: NIGHTS,
} as const;

export const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const COST_BAND: Record<ExploreAnswers["cost"], [number, number]> = {
  "under-500": [0, 500],
  "500-1000": [500, 1000],
  more: [1000, FILTER.price.max],
};

export function filterFromAnswers(answers: ExploreAnswers): ExploreFilter {
  const months = SEASON[answers.when];
  const [priceMin, priceMax] = COST_BAND[answers.cost];
  return {
    people: SIZE_PROBE[answers.size],
    fromMonth: months[0],
    toMonth: months[months.length - 1],
    priceMin,
    priceMax,
    nights: answers.nights,
  };
}

function seasonOf(filter: ExploreFilter): ExploreAnswers["when"] {
  if (filter.fromMonth === 1 && filter.toMonth === 12) return "any";
  const middle = Math.floor((filter.fromMonth + filter.toMonth) / 2);
  const found = (["spring", "summer", "autumn"] as const).find((s) => SEASON[s].includes(middle));
  return found ?? "any";
}

export function answersFromFilter(filter: ExploreFilter, pace: ExploreAnswers["pace"]): ExploreAnswers {
  const size = filter.people <= 4 ? "2-4" : filter.people <= 8 ? "5-8" : "9+";
  const cost = filter.priceMax <= 500 ? "under-500" : filter.priceMin >= 1000 ? "more" : "500-1000";
  return { size, when: seasonOf(filter), cost, pace, nights: filter.nights };
}

export const DEFAULT_FILTER: ExploreFilter = filterFromAnswers({
  size: "5-8",
  when: "summer",
  cost: "500-1000",
  pace: "base",
  nights: NIGHTS.max,
});

export function monthWindow(filter: ExploreFilter): string {
  const from = MONTH_SHORT[filter.fromMonth - 1];
  return filter.fromMonth === filter.toMonth ? from : `${from}–${MONTH_SHORT[filter.toMonth - 1]}`;
}

function peopleCheck(trip: PresetTrip, people: number): { fit?: string; miss?: string } {
  const range = groupRange(trip.groupSize);
  if (!range) return {};
  const top = people >= FILTER.people.max;
  const fits = top ? range.max >= people : people >= range.min && people <= range.max;
  return fits ? { fit: `Fits ${people}${top ? "+" : ""}` } : { miss: `For ${range.min}–${range.max}` };
}

// Why: listings mix GBP and EUR; the band is rough enough that minor units
// compare directly rather than pulling in a rate for a filter.
function priceCheck(trip: PresetTrip, filter: ExploreFilter): { fit?: string; miss?: string } {
  if (trip.priceFromMinor < filter.priceMin * 100) return { miss: "Under budget" };
  if (filter.priceMax < FILTER.price.max && trip.priceFromMinor > filter.priceMax * 100) return { miss: "Over budget" };
  return { fit: "In budget" };
}

function monthCheck(trip: PresetTrip, filter: ExploreFilter): { fit?: string; miss?: string } {
  if (filter.fromMonth === FILTER.month.min && filter.toMonth === FILTER.month.max) return {};
  const inWindow = monthsOf(trip.bestMonths).some((m) => m >= filter.fromMonth && m <= filter.toMonth);
  return inWindow ? { fit: monthWindow(filter) } : { miss: `Best ${trip.bestMonths}` };
}

export function filterCheck(trip: PresetTrip, filter: ExploreFilter): { fits: string[]; misses: string[] } {
  const checks = [peopleCheck(trip, filter.people), monthCheck(trip, filter), priceCheck(trip, filter)];
  if (filter.nights < NIGHTS.max && trip.nights > filter.nights) checks.push({ miss: `${trip.nights} nights` });
  return {
    fits: checks.flatMap((c) => (c.fit ? [c.fit] : [])),
    misses: checks.flatMap((c) => (c.miss ? [c.miss] : [])),
  };
}

export function forYou(trips: readonly PresetTrip[], filter: ExploreFilter, count: number): PresetTrip[] {
  return trips
    .filter((t) => filter.nights >= NIGHTS.max || t.nights <= filter.nights)
    .map((trip) => ({ trip, ...filterCheck(trip, filter) }))
    .filter((x) => x.misses.length <= 1)
    .sort((a, b) => a.misses.length - b.misses.length || b.fits.length - a.fits.length)
    .slice(0, count)
    .map((x) => x.trip);
}

const whole = (value: unknown, min: number, max: number): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;

export function readFilter(value: unknown): ExploreFilter | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const { people, month, price, nights } = FILTER;
  const ok =
    whole(raw.people, people.min, people.max) &&
    whole(raw.fromMonth, month.min, month.max) &&
    whole(raw.toMonth, raw.fromMonth, month.max) &&
    whole(raw.priceMin, price.min, price.max) &&
    whole(raw.priceMax, raw.priceMin, price.max) &&
    whole(raw.nights, nights.min, nights.max);
  if (!ok) return null;
  return {
    people: raw.people as number,
    fromMonth: raw.fromMonth as number,
    toMonth: raw.toMonth as number,
    priceMin: raw.priceMin as number,
    priceMax: raw.priceMax as number,
    nights: raw.nights as number,
  };
}

/** The filter a profile holds, or one made from the band answers the phone last saved. */
export function savedFilter(saved: unknown): ExploreFilter | null {
  const own = saved && typeof saved === "object" ? readFilter((saved as { filter?: unknown }).filter) : null;
  if (own) return own;
  const answers = readAnswers(saved);
  return answers ? filterFromAnswers(answers) : null;
}

export function withFilter(saved: unknown, filter: ExploreFilter): ExploreAnswers & { filter: ExploreFilter } {
  const pace = readAnswers(saved)?.pace ?? "base";
  return { ...answersFromFilter(filter, pace), filter };
}
