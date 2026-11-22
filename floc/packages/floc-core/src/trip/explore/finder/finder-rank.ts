import type { Fits } from "../fit/listing-fit";
import type { PresetTrip } from "../preset-trip-types";
import { fits, priceFigure, type Finder } from "./finder";
import type { TripTag } from "./tag-groups";
import { tagsOf } from "./trip-tags";

export const FINDER_SORTS = {
  season: "Top picks first",
  match: "Saved first",
  cheap: "Price, low to high",
  dear: "Price, high to low",
  short: "Shortest first",
  long: "Longest first",
} as const;

export type FinderSort = keyof typeof FINDER_SORTS;

export const sortLabel = (sort: FinderSort, matched: boolean): string => (sort === "match" && matched ? "Best match first" : FINDER_SORTS[sort]);

export type Ranked = {
  trip: PresetTrip;
  hits: TripTag[];
  score: number;
  fit: number | null;
};

const price = (r: Ranked) => priceFigure(r.trip, "trip");
const best = (a: Ranked, b: Ranked) => b.score - a.score || price(a) - price(b);
const fitted = (a: Ranked, b: Ranked) => (b.fit ?? -1) - (a.fit ?? -1) || price(a) - price(b);
const ORDER: Record<FinderSort, (a: Ranked, b: Ranked) => number> = {
  season: best,
  match: best,
  cheap: (a, b) => price(a) - price(b),
  dear: (a, b) => price(b) - price(a),
  short: (a, b) => a.trip.nights - b.trip.nights || price(a) - price(b),
  long: (a, b) => b.trip.nights - a.trip.nights || price(a) - price(b),
};

const LEAD_IN_MATCH = 3;
function pickLead(picks: readonly string[], sort: FinderSort, open: boolean): (a: Ranked, b: Ranked) => number {
  const count = sort === "season" ? picks.length : sort === "match" && open ? LEAD_IN_MATCH : 0;
  const at = new Map(picks.slice(0, count).map((id, i) => [id, i]));
  const rank = (r: Ranked) => at.get(r.trip.id) ?? count;
  return (a, b) => rank(a) - rank(b);
}

function orderFor(f: Finder, sort: FinderSort, saved: ReadonlySet<string>, picks: readonly string[], matched: boolean): (a: Ranked, b: Ranked) => number {
  if (sort === "match" && matched) return fitted;
  const lead = pickLead(picks, sort, !f.likes.length);
  const savedFirst = sort === "match";
  return (a, b) => (savedFirst ? Number(saved.has(b.trip.id)) - Number(saved.has(a.trip.id)) : 0) || lead(a, b) || ORDER[sort](a, b);
}

export function rankTrips(
  trips: readonly PresetTrip[],
  f: Finder,
  sort: FinderSort,
  saved: ReadonlySet<string> = new Set(),
  picks: readonly string[] = [],
  figures: Fits | null = null,
): Ranked[] {
  const order = orderFor(f, sort, saved, picks, figures !== null);
  return trips
    .filter((t) => fits(t, f))
    .map((trip) => {
      const tags = tagsOf(trip);
      const hits = f.likes.filter((x) => tags.includes(x));
      return { trip, hits, score: f.likes.length ? hits.length / f.likes.length : 0, fit: figures?.[trip.id] ?? null };
    })
    .sort((a, b) => order(a, b) || a.trip.title.localeCompare(b.trip.title, "en-GB"));
}
