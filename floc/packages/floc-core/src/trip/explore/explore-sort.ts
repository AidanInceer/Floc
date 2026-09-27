import type { Currency } from "../../money/currency";
import { minorPerMajor } from "../../money/currency";
import type { PresetTrip } from "./preset-trip-types";

export const EXPLORE_SORTS = {
  price: "Cheapest",
  "price-desc": "Priciest",
  shortest: "Shortest",
  longest: "Longest",
} as const;

export type ExploreSort = keyof typeof EXPLORE_SORTS;

export type SortColumn = "price" | "nights";

const COLUMNS: Record<SortColumn, readonly [up: ExploreSort, down: ExploreSort]> = {
  price: ["price", "price-desc"],
  nights: ["shortest", "longest"],
};

export function sortDirection(sort: ExploreSort, column: SortColumn): "up" | "down" | null {
  const [up, down] = COLUMNS[column];
  return sort === up ? "up" : sort === down ? "down" : null;
}

/** The sort a column's header leads to: low to high first, then turned around. */
export function flipSort(sort: ExploreSort, column: SortColumn): ExploreSort {
  const [up, down] = COLUMNS[column];
  return sort === up ? down : up;
}

export const DEFAULT_EXPLORE_SORT: ExploreSort = "price";

export function readExploreSort(value: unknown): ExploreSort {
  return typeof value === "string" && value in EXPLORE_SORTS ? (value as ExploreSort) : DEFAULT_EXPLORE_SORT;
}

/** Home-currency multiplier per currency, as `HomeRates.toHome` carries it. 0 or absent means no rate. */
export type RatesToHome = Partial<Record<Currency, number>>;

// Why: listings are illustrative, so a rough rate only has to keep the order sane when the provider is down.
export const FIXED_RATES_TO_GBP: Partial<Record<Currency, number>> = { GBP: 1, EUR: 0.85 };

export function sortPresetTrips(trips: readonly PresetTrip[], sort: ExploreSort, rates: RatesToHome | null): PresetTrip[] {
  const byTitle = (a: PresetTrip, b: PresetTrip) => a.title.localeCompare(b.title, "en-GB");
  const key = sortKey(trips, sort, rates);
  return [...trips].sort((a, b) => key(a) - key(b) || byTitle(a, b));
}

function sortKey(trips: readonly PresetTrip[], sort: ExploreSort, rates: RatesToHome | null): (trip: PresetTrip) => number {
  if (sort === "shortest") return (t) => t.nights;
  if (sort === "longest") return (t) => -t.nights;
  const sign = sort === "price-desc" ? -1 : 1;
  // Mixing live and fixed rates would compare two different yardsticks.
  const live = rates !== null && trips.every((t) => (rates[t.currency] ?? 0) > 0);
  const table = live ? rates : FIXED_RATES_TO_GBP;
  return (t) => sign * (t.priceFromMinor / minorPerMajor(t.currency)) * (table[t.currency] ?? 0);
}
