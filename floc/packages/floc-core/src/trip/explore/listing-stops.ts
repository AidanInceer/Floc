import type { TransportType } from "../../vocabulary";
import type { PresetTrip } from "./preset-trip-types";

export type ListingMove = { place: string; mode: TransportType; detail: string };
type DayOut = ListingMove & { lat?: number; lng?: number };

export type ListingStop = {
  place: string;
  nights: number;
  lat: number;
  lng: number;
  country?: string;
  arrive: ListingMove | null;
  dayOuts: DayOut[];
};

export function stopsOf(trip: PresetTrip): ListingStop[] {
  const stops: ListingStop[] = [];
  trip.legs.forEach((leg, i) => {
    if (leg.kind === "base") {
      const before = trip.legs[i - 1];
      const arrive = before?.kind === "hop" ? { place: before.place, mode: before.mode, detail: before.detail } : null;
      stops.push({ place: leg.place, nights: leg.nights, lat: leg.lat, lng: leg.lng, ...(leg.country ? { country: leg.country } : {}), arrive, dayOuts: [] });
    } else if (trip.legs[i + 1]?.kind !== "base") {
      const spot = leg.lat !== undefined && leg.lng !== undefined ? { lat: leg.lat, lng: leg.lng } : {};
      stops.at(-1)?.dayOuts.push({ place: leg.place, mode: leg.mode, detail: leg.detail, ...spot });
    }
  });
  return stops;
}
