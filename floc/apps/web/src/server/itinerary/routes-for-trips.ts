/**
 * Every listed trip's route, for the map on each bar of My trips: two queries for the whole list, never one per trip.
 * Split by trip in @floc/core, the same way the Overview builds one trip's route.
 */
import "server-only";

import { and, asc, eq, inArray, isNull } from "drizzle-orm";

import { db } from "@/db";
import { day, dayEvent, place } from "@/db/schema";
import { routesByTrip, type TripHop } from "@floc/core/trip/overview/routes-by-trip";
import type { OverviewRoute } from "@floc/core/trip/overview/route";
import { LIMITS } from "@/server/limits";

export async function routesForTrips(tripIds: number[]): Promise<Map<number, OverviewRoute>> {
  if (tripIds.length === 0) return new Map();
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

  // The first transport event of a day says how that leg travels, as on the Overview.
  const firstHop = new Map<number, TripHop>();
  for (const e of events) if (e.mode && !firstHop.has(e.dayId)) firstHop.set(e.dayId, { ...e, mode: e.mode });
  return routesByTrip(days, [...firstHop.values()]);
}
