// Why: the web page's own steps (`overview/page.tsx`) from the phone's queries, so both maps draw the same route.
import type { ItineraryDay, TripPlace } from "@floc/api/port";
import { overviewRoute, type HopTimes, type OverviewRoute } from "@floc/core/trip/overview/route";
import type { TransportType } from "@floc/core/vocabulary";

type RouteLeg = { placeId: number; placeName: string; days: { dayId: number }[]; nights: number; mode: TransportType | null };

export function routeOf(legs: RouteLeg[], days: ItineraryDay[], places: TripPlace[]): OverviewRoute {
  const byId = new Map(places.map((p) => [p.id, p]));
  const pins = days.map((d) => {
    const place = d.overnightPlaceId === null ? undefined : byId.get(d.overnightPlaceId);
    return { overnightPlaceId: d.overnightPlaceId, lat: place?.lat ?? null, lng: place?.lng ?? null, countryCode: place?.countryCode ?? null };
  });
  const hops = new Map<number, HopTimes>();
  for (const d of days) {
    const first = d.events.filter((e) => e.type === "transport").sort((a, b) => a.orderIndex - b.orderIndex)[0];
    if (first) hops.set(d.id, { time: first.time, endTime: first.endTime });
  }
  return overviewRoute({ legs, days: pins, hops });
}
