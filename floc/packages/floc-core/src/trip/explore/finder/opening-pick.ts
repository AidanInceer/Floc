import type { PresetTrip } from "../preset-trip-types";
import { seasonPicks } from "./season-picks";
import type { TripTag } from "./tag-groups";
import { tagsOf } from "./trip-tags";

export const OPENING_POOL = 3;

export type Viewer = { saved: readonly string[]; likes: readonly TripTag[] | null };

function byFit(picks: readonly PresetTrip[], likes: readonly TripTag[]): PresetTrip[] {
  const fit = (trip: PresetTrip) => tagsOf(trip).filter((tag) => likes.includes(tag)).length;
  return picks
    .map((trip, at) => ({ trip, at, fit: fit(trip) }))
    .sort((a, b) => b.fit - a.fit || a.at - b.at)
    .map(({ trip }) => trip);
}

export function openingPool(trips: readonly PresetTrip[], season: readonly number[], viewer: Viewer): PresetTrip[] {
  const inSeason = seasonPicks(trips, season);
  const picks = inSeason.length ? inSeason : [...trips];
  if (viewer.likes === null) return picks;
  const saved = viewer.saved.flatMap((id) => trips.filter((t) => t.id === id));
  if (saved.length >= OPENING_POOL) return saved;
  const rest = byFit(picks, viewer.likes).filter((t) => !saved.includes(t));
  return [...saved, ...rest].slice(0, OPENING_POOL);
}

export function openingPick(pool: readonly PresetTrip[], roll: number): PresetTrip {
  return pool[Math.min(pool.length - 1, Math.floor(roll * pool.length))];
}
