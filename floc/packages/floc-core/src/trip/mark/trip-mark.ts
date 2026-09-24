/**
 * The mark a trip wears (#318) — ten places and holiday types in the app's own hand, never a photo.
 *
 * Why: an image URL means hotlinking, availability and content risk off a host we do not control,
 * the same call #157 made for a face. Ten because the phone picker is two rows of five — grow the
 * set by five or not at all. Shape only: colour stays `tripPastel`, which is how you follow one
 * trip across the list, its tags and its header.
 */

// Values are stored; labels name the control. Order is picker order.
export const TRIP_MARK_LABELS = {
  wave: "Wave",
  mountain: "Mountain",
  city: "City",
  tent: "Tent",
  sun: "Sun",
  house: "House",
  forest: "Forest",
  umbrella: "Umbrella",
  sail: "Sailing boat",
  cruise: "Cruise ship",
} as const;

export type TripMark = keyof typeof TRIP_MARK_LABELS;

export const TRIP_MARKS = Object.keys(
  TRIP_MARK_LABELS,
) as readonly TripMark[] as readonly [TripMark, ...TripMark[]];

// Why: null is the default, not a fallback — a mark dropped in a later release degrades to the
// trip's pastel rather than a hole.
export function readTripMark(value: unknown): TripMark | null {
  return typeof value === "string" && value in TRIP_MARK_LABELS
    ? (value as TripMark)
    : null;
}
