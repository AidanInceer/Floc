/**
 * The mark a trip wears (#318). Ten places and holiday types, drawn in the
 * app's own hand — never a photo.
 *
 * WHY NOT AN IMAGE. `trip.cover_image_url` was free text pointing at a host we
 * do not control, which is the hotlinking, availability and content risk #157
 * took off a person's face. A trip is a different decision from a face, so it
 * was left alone then and answered here: the same rule, because the risk is the
 * same and nothing ever rendered the URL.
 *
 * TEN, NOT ELEVEN. The phone picker is two rows of five; an eleventh mark
 * orphans a row. Grow this set by five or not at all.
 *
 * Shape only. The pastel behind it is still `tripPastel` — the mark says what
 * kind of trip it is, the colour is how you follow one trip across the list,
 * its tags and its header, and letting the mark carry colour breaks that.
 */

/** Values are stored; labels name the control. Order is picker order. */
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

/**
 * Null means no mark, which is the default rather than a fallback — the trip
 * still has its pastel, so a mark dropped from the set in a later release
 * degrades to a colour, not a hole.
 */
export function readTripMark(value: unknown): TripMark | null {
  return typeof value === "string" && value in TRIP_MARK_LABELS
    ? (value as TripMark)
    : null;
}
