export const TRIP_COLORS = ["peri", "mint", "butter", "blush"] as const;

export type TripColor = (typeof TRIP_COLORS)[number];

export function isTripColor(value: unknown): value is TripColor {
  return (
    typeof value === "string" && (TRIP_COLORS as readonly string[]).includes(value)
  );
}

export function readTripColor(value: unknown): TripColor | null {
  return isTripColor(value) ? value : null;
}

export function tripPastel(color: TripColor | null, tripId: number): TripColor {
  return color ?? TRIP_COLORS[tripId % TRIP_COLORS.length];
}
