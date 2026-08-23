/**
 * A trip's chosen pastel (ticket 213). Previously the card colour was derived
 * from the id; now a member can pick it, and the trip's tags wear the same
 * colour rather than each carrying its own (which is why ticket 86's per-tag
 * tones went). Null means "not chosen" — the id-rotation still fills in.
 *
 * Pure: `trip.color_key` is free text on the row, so the reader guards it the
 * same degrade-don't-crash way as `readTags` (rule 11).
 */
export const TRIP_COLORS = ["peri", "mint", "butter", "blush"] as const;

export type TripColor = (typeof TRIP_COLORS)[number];

export function isTripColor(value: unknown): value is TripColor {
  return (
    typeof value === "string" && (TRIP_COLORS as readonly string[]).includes(value)
  );
}

/** A picked colour, or null for the id-rotation default. */
export function readTripColor(value: unknown): TripColor | null {
  return isTripColor(value) ? value : null;
}
