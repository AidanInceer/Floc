/**
 * The mark a trip wears (#318) — fifteen places and holiday types in the app's own hand, never a photo.
 *
 * Why: an image URL means hotlinking, availability and content risk off a host we do not control,
 * the same call #157 made for a face. Fifteen because the phone picker is three rows of five — grow
 * the set by five or not at all. Shape only: colour stays `tripPastel`, which is how you follow one
 * trip across the list, its tags and its header.
 */

// Values are stored; labels name the control. Order is picker order.
export const TRIP_MARK_LABELS = {
  wave: "Wave",
  mountain: "Mountain",
  skyline: "Skyline",
  forest: "Forest",
  house: "House",
  sun: "Sun",
  campfire: "Campfire",
  camper: "Camper van",
  island: "Island",
  lighthouse: "Lighthouse",
  lolly: "Ice lolly",
  sunglasses: "Sunglasses",
  flipflop: "Flip-flop",
  cocktail: "Cocktail",
  globe: "Globe",
} as const;

export type TripMark = keyof typeof TRIP_MARK_LABELS;

export const TRIP_MARKS = Object.keys(
  TRIP_MARK_LABELS,
) as readonly TripMark[] as readonly [TripMark, ...TripMark[]];

// Why: these five left the set on 2026-11-07. A trip that still stores one shows the globe rather
// than losing its mark; the row is never rewritten.
const RETIRED_MARKS: ReadonlySet<string> = new Set(["city", "tent", "umbrella", "sail", "cruise"]);

// Why: null is the default, not a fallback — a trip with no mark shows its pastel alone.
export function readTripMark(value: unknown): TripMark | null {
  if (typeof value !== "string") return null;
  if (value in TRIP_MARK_LABELS) return value as TripMark;
  return RETIRED_MARKS.has(value) ? "globe" : null;
}
