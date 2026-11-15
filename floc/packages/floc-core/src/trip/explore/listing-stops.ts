import type { TransportType } from "../../vocabulary";
import type { PresetTrip } from "./preset-trip-types";

export type ListingMove = { place: string; mode: TransportType; detail: string };
/** A day out, with its own place on the map where the listing gives one. */
type DayOut = ListingMove & { lat?: number; lng?: number };

/** One base of a listing: where you sleep, how you got there, and the day outs made from it. */
export type ListingStop = {
  place: string;
  nights: number;
  lat: number;
  lng: number;
  /** Set only where the listing crosses borders. */
  country?: string;
  /** The hop right before this base. On the first stop it is how the trip starts, if the listing says. */
  arrive: ListingMove | null;
  dayOuts: DayOut[];
};

/** The one reading of a listing's legs: a hop before a base is the way in; any other hop is a day out from the stop before it. */
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
