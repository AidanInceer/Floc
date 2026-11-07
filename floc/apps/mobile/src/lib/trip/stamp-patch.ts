import type { TripMark } from "@floc/core/trip/mark/trip-mark";
import type { TripColor } from "@floc/core/trip/trip-color";

export function colourPatch(tripId: number, color: TripColor) {
  return { tripId, colorKey: color } as const;
}

// Why: tapping the mark already on the trip clears it, as on the web, so "no mark" needs no control.
export function markPatch(tripId: number, current: TripMark | null, tapped: TripMark) {
  return { tripId, mark: current === tapped ? null : tapped } as const;
}
