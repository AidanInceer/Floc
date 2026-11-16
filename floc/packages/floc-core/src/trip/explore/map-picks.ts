import type { PresetTrip } from "./preset-trip-types";

export function mapPicks(trips: readonly PresetTrip[], perRegion: number): PresetTrip[] {
  const taken = new Map<string, number>();
  return trips.filter((trip) => {
    const count = taken.get(trip.region) ?? 0;
    taken.set(trip.region, count + 1);
    return count < perRegion;
  });
}
