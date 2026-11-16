import { stopsOf } from "@floc/core/trip/explore/listing-stops";
import type { PresetTrip } from "@floc/core/trip/explore/preset-trips";
import type { TransportType } from "@floc/core/vocabulary";

export type RouteStop = { place: string; lat: number; lng: number; nights?: number };
type Move = { mode: TransportType | null; time: string } | null;
type DayOut = { at: number; place: string; mode: TransportType; lat?: number; lng?: number };
export type TripRoute = { stops: RouteStop[]; moves: Move[]; outs?: DayOut[] };

export function tripRoute(trip: PresetTrip): TripRoute {
  const stops = stopsOf(trip);
  return {
    stops: stops.map(({ place, lat, lng, nights }) => ({ place, lat, lng, nights })),
    moves: stops.slice(1).map(({ arrive }) => (arrive ? { mode: arrive.mode, time: arrive.detail } : null)),
    outs: stops.flatMap((stop, at) => stop.dayOuts.map(({ place, mode, lat, lng }) => ({ at, place, mode, lat, lng }))),
  };
}
