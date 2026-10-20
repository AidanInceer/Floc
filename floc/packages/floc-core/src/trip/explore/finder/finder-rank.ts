import type { PresetTrip } from "../preset-trip-types";
import { fits, priceFigure, type Finder } from "./finder";
import type { TripTag } from "./tag-groups";
import { tagsOf } from "./trip-tags";

export const FINDER_SORTS = {
  match: "Best match",
  cheap: "Price, low to high",
  dear: "Price, high to low",
  short: "Shortest first",
  long: "Longest first",
} as const;

export type FinderSort = keyof typeof FINDER_SORTS;

export const isFinderSort = (value: unknown): value is FinderSort => typeof value === "string" && value in FINDER_SORTS;

export type Ranked = {
  trip: PresetTrip;
  /** The tags you like that this listing has. */
  hits: TripTag[];
  /** With "more like this": the tags it shares with that listing. */
  shared: TripTag[] | null;
  score: number;
};

// Why: cosine over tags plus region, so the region counts towards likeness but is never named as a shared tag.
function alike(a: PresetTrip, b: PresetTrip): { score: number; shared: TripTag[] } {
  const mine = new Set<string>([...tagsOf(a), a.region]);
  const theirs = [...tagsOf(b), b.region];
  const shared = theirs.filter((x) => mine.has(x));
  return { score: shared.length / Math.sqrt(mine.size * theirs.length), shared: shared.filter((x): x is TripTag => x !== a.region) };
}

const price = (r: Ranked) => priceFigure(r.trip, "trip");
const ORDER: Record<FinderSort, (a: Ranked, b: Ranked) => number> = {
  match: (a, b) => b.score - a.score || price(a) - price(b),
  cheap: (a, b) => price(a) - price(b),
  dear: (a, b) => price(b) - price(a),
  short: (a, b) => a.trip.nights - b.trip.nights || price(a) - price(b),
  long: (a, b) => b.trip.nights - a.trip.nights || price(a) - price(b),
};

/** Every listing that fits, in the order asked. What you like ranks; it never hides. `likeId` ranks by likeness to that listing. */
export function rankTrips(trips: readonly PresetTrip[], f: Finder, sort: FinderSort, likeId: string | null): Ranked[] {
  const like = trips.find((t) => t.id === likeId) ?? null;
  return trips
    .filter((t) => t !== like && fits(t, f))
    .map((trip) => {
      const tags = tagsOf(trip);
      const hits = f.likes.filter((x) => tags.includes(x));
      if (like) return { trip, hits, ...alike(like, trip) };
      return { trip, hits, shared: null, score: f.likes.length ? hits.length / f.likes.length : 0 };
    })
    .sort((a, b) => ORDER[sort](a, b) || a.trip.title.localeCompare(b.trip.title, "en-GB"));
}
