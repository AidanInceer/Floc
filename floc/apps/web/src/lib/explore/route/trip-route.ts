import type { PresetTrip } from "@floc/core/trip/explore/preset-trips";
import type { TransportType } from "@floc/core/vocabulary";

export type RouteStop = { place: string; lat: number; lng: number };
/** How the group gets from one stop to the next; null when the listing does not say. A group's own leg with no mode yet says so in `time`. */
type Move = { mode: TransportType | null; time: string } | null;
/** A day out from stop `at`, and back the same day. */
type DayOut = { at: number; place: string; mode: TransportType };
/** A listing as a map draws it: `moves[k]` goes from `stops[k]` to `stops[k + 1]`. */
export type TripRoute = { stops: RouteStop[]; moves: Move[]; outs: DayOut[] };

export function tripRoute(trip: PresetTrip): TripRoute {
  const route: TripRoute = { stops: [], moves: [], outs: [] };
  let move: Move = null;
  trip.legs.forEach((leg, i) => {
    if (leg.kind === "base") {
      if (route.stops.length) route.moves.push(move);
      route.stops.push({ place: leg.place, lat: leg.lat, lng: leg.lng });
      move = null;
      return;
    }
    if (!route.stops.length) return;
    if (trip.legs[i + 1]?.kind === "base") move = { mode: leg.mode, time: leg.detail };
    else route.outs.push({ at: route.stops.length - 1, place: leg.place, mode: leg.mode });
  });
  return route;
}
