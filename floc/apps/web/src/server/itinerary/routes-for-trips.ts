import "server-only";

import { and, asc, eq, inArray, isNull } from "drizzle-orm";

import { db } from "@/db";
import { day, dayEvent, place } from "@/db/schema";
import { routesByTrip, type TripHop } from "@floc/core/trip/overview/routes-by-trip";
import type { OverviewRoute } from "@floc/core/trip/overview/route";
import { LIMITS } from "@/server/limits";

export type TripRoutes = { routes: Map<number, OverviewRoute>; firstPlace: Map<number, string> };

export async function routesForTrips(tripIds: number[]): Promise<Map<number, OverviewRoute>> {
  return (await readTripRoutes(tripIds)).routes;
}

export async function readTripRoutes(tripIds: number[]): Promise<TripRoutes> {
  if (tripIds.length === 0) return { routes: new Map(), firstPlace: new Map() };
  const live = and(inArray(day.tripId, tripIds), isNull(day.deletedAt));
  const [days, events] = await Promise.all([
    db
      .select({
        tripId: day.tripId,
        dayId: day.id,
        date: day.date,
        overnightPlaceId: day.overnightPlaceId,
        placeName: place.name,
        lat: place.lat,
        lng: place.lng,
        countryCode: place.countryCode,
      })
      .from(day)
      .leftJoin(place, and(eq(place.id, day.overnightPlaceId), isNull(place.deletedAt)))
      .where(live)
      .orderBy(asc(day.date))
      .limit(LIMITS.tripsPerUser * LIMITS.days)
      .all(),
    db
      .select({ tripId: day.tripId, dayId: dayEvent.dayId, mode: dayEvent.transportType, time: dayEvent.time, endTime: dayEvent.endTime })
      .from(dayEvent)
      .innerJoin(day, eq(day.id, dayEvent.dayId))
      .where(and(live, eq(dayEvent.type, "transport"), isNull(dayEvent.deletedAt)))
      .orderBy(asc(dayEvent.orderIndex))
      .limit(LIMITS.tripsPerUser * LIMITS.days)
      .all(),
  ]);

  const firstHop = new Map<number, TripHop>();
  for (const e of events) if (e.mode && !firstHop.has(e.dayId)) firstHop.set(e.dayId, { ...e, mode: e.mode });
  const firstPlace = new Map<number, string>();
  for (const d of days) if (d.placeName !== null && !firstPlace.has(d.tripId)) firstPlace.set(d.tripId, d.placeName);
  return { routes: routesByTrip(days, [...firstHop.values()]), firstPlace };
}
