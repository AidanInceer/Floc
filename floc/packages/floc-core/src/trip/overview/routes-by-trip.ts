/**
 * Every trip's route at once, for the bars on My trips: one read of days and one of transport for the whole list,
 * split here by trip. Pure — the server hands in the rows.
 */
import type { IsoDate } from "../../dates/dates";
import type { TransportType } from "../../vocabulary";
import { tripLegs } from "./legs";
import { overviewRoute, type HopTimes, type OverviewRoute, type RouteDayPin } from "./route";

export type TripRouteDay = RouteDayPin & { tripId: number; dayId: number; date: IsoDate; placeName: string | null };
/** A day's first transport event. */
export type TripHop = HopTimes & { tripId: number; dayId: number; mode: TransportType };

function byTrip<T extends { tripId: number }>(rows: T[]): Map<number, T[]> {
  const out = new Map<number, T[]>();
  for (const r of rows) {
    const list = out.get(r.tripId);
    if (list) list.push(r);
    else out.set(r.tripId, [r]);
  }
  return out;
}

export function routesByTrip(days: TripRouteDay[], hops: TripHop[]): Map<number, OverviewRoute> {
  const hopsOf = byTrip(hops);
  const routes = new Map<number, OverviewRoute>();
  for (const [tripId, list] of byTrip(days)) {
    const sorted = [...list].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    const tripHops = hopsOf.get(tripId) ?? [];
    const modes = new Map(tripHops.map((h) => [h.dayId, h.mode]));
    const { legs } = tripLegs({ days: sorted, modes, files: [] });
    routes.set(tripId, overviewRoute({ legs, days: sorted, hops: new Map(tripHops.map((h) => [h.dayId, h])) }));
  }
  return routes;
}
