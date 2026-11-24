import "server-only";

import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";

import { db } from "@/db";
import { day, place, trip } from "@/db/schema";
import { hasEnded } from "@floc/core/dates/dates";
import type { OverviewRoute } from "@floc/core/trip/overview/route";
import { readTripRoutes } from "@/server/itinerary/routes-for-trips";
import { listTripsFor } from "@/server/trips/trips";

export type PastTripMap = { id: number; route: OverviewRoute | null };

export async function firstPlaces(tripIds: number[]): Promise<Map<number, string>> {
  if (tripIds.length === 0) return new Map();
  const firstStay = db
    .select({ name: place.name })
    .from(day)
    .innerJoin(place, eq(place.id, day.overnightPlaceId))
    .where(and(eq(day.tripId, trip.id), isNull(day.deletedAt), isNull(place.deletedAt)))
    .orderBy(asc(day.date))
    .limit(1);
  const rows = await db
    .select({ id: trip.id, name: sql<string | null>`(${firstStay})` })
    .from(trip)
    .where(inArray(trip.id, tripIds))
    .all();
  return new Map(rows.flatMap((r) => (r.name === null ? [] : [[r.id, r.name] as const])));
}

export async function loadPastTripMaps(viewerId: string): Promise<PastTripMap[]> {
  const rows = await listTripsFor(viewerId, { archived: false });
  const pastIds = rows.filter((r) => hasEnded(r.endDate)).map((r) => r.id);
  const { routes } = await readTripRoutes(pastIds);
  return pastIds.map((id) => ({ id, route: routes.get(id) ?? null }));
}
