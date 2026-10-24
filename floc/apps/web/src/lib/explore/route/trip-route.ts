import { stopsOf } from "@floc/core/trip/explore/listing-stops";
import type { PresetTrip } from "@floc/core/trip/explore/preset-trips";
import type { TransportType } from "@floc/core/vocabulary";

/** `nights` is written on the stop's name; a stop with none has no nights end. */
export type RouteStop = { place: string; lat: number; lng: number; nights?: number };
/** How the group gets from one stop to the next; null when the listing does not say. A group's own leg with no mode yet says so in `time`. */
type Move = { mode: TransportType | null; time: string } | null;
/** A day out from stop `at`, and back the same day. */
type DayOut = { at: number; place: string; mode: TransportType };
/** A route as a map draws it: `moves[k]` goes from `stops[k]` to `stops[k + 1]`. A group's own route has no day outs. */
export type TripRoute = { stops: RouteStop[]; moves: Move[]; outs?: DayOut[] };

export function tripRoute(trip: PresetTrip): TripRoute {
  const stops = stopsOf(trip);
  return {
    stops: stops.map(({ place, lat, lng, nights }) => ({ place, lat, lng, nights })),
    moves: stops.slice(1).map(({ arrive }) => (arrive ? { mode: arrive.mode, time: arrive.detail } : null)),
    outs: stops.flatMap((stop, at) => stop.dayOuts.map(({ place, mode }) => ({ at, place, mode }))),
  };
}
