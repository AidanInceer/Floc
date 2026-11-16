import "server-only";

import { and, eq, inArray, isNull } from "drizzle-orm";

import { db } from "@/db";
import { day, dayEvent, place, trip, tripMembership, userCountryMark } from "@/db/schema";
import { readCountryCode } from "@floc/core/people/countries";
import { hasEnded } from "@floc/core/dates/dates";
import { mergeMarks, strongest, type MapState, type TravelMap } from "@floc/core/itinerary/travel-map";
import { bounded, LIMITS } from "@/server/limits";
import type { CountryMarkState } from "@/db/schema";

async function countriesForTrips(
  trips: TripEnd[],
): Promise<Record<string, MapState>> {
  const out: Record<string, MapState> = {};
  for (const perTrip of (await countriesByTrip(trips)).values()) {
    for (const [code, state] of Object.entries(perTrip)) {
      out[code] = strongest(out[code], state);
    }
  }
  return out;
}

async function countriesByTrip(
  trips: TripEnd[],
): Promise<Map<number, Record<string, MapState>>> {
  const byTrip = new Map<number, Record<string, MapState>>();
  if (trips.length === 0) return byTrip;

  const ids = trips.map((t) => t.id);
  const colour = new Map<number, MapState>(
    trips.map((t) => [t.id, hasEnded(t.endDate) ? "green" : "yellow"]),
  );

  const [overnights, events] = await Promise.all([
    db
      .select({ tripId: day.tripId, countryCode: place.countryCode })
      .from(day)
      .innerJoin(place, eq(place.id, day.overnightPlaceId))
      .where(and(inArray(day.tripId, ids), isNull(day.deletedAt), isNull(place.deletedAt)))
      .all(),
    db
      .select({ tripId: day.tripId, countryCode: place.countryCode })
      .from(dayEvent)
      .innerJoin(day, eq(day.id, dayEvent.dayId))
      .innerJoin(place, eq(place.id, dayEvent.placeId))
      .where(
        and(
          inArray(day.tripId, ids),
          isNull(dayEvent.deletedAt),
          isNull(day.deletedAt),
          isNull(place.deletedAt),
        ),
      )
      .all(),
  ]);

  for (const row of [...overnights, ...events]) {
    const code = readCountryCode(row.countryCode);
    const state = code ? colour.get(row.tripId) : undefined;
    if (!code || !state) continue;

    const perTrip = byTrip.get(row.tripId) ?? {};
    perTrip[code] = strongest(perTrip[code], state);
    byTrip.set(row.tripId, perTrip);
  }

  return byTrip;
}

type TripEnd = { id: number; endDate: string | null };

async function currentTrips(userId: string): Promise<TripEnd[]> {
  const rows = await db
    .select({ id: trip.id, endDate: trip.endDate })
    .from(tripMembership)
    .innerJoin(trip, eq(trip.id, tripMembership.tripId))
    .where(and(eq(tripMembership.userId, userId), isNull(tripMembership.deletedAt), isNull(trip.deletedAt)))
    .limit(LIMITS.tripsPerUser)
    .all();
  return bounded(rows, "tripsPerUser", "travel map");
}

async function manualMarksFor(
  userId: string,
): Promise<Record<string, CountryMarkState>> {
  const rows = await db
    .select({ countryCode: userCountryMark.countryCode, state: userCountryMark.state })
    .from(userCountryMark)
    .where(eq(userCountryMark.userId, userId))
    .all();

  const out: Record<string, CountryMarkState> = {};
  for (const row of rows) {
    const code = readCountryCode(row.countryCode);
    if (code) out[code] = row.state;
  }
  return out;
}

export async function travelMapFor(userId: string): Promise<TravelMap> {
  const [trips, manual] = await Promise.all([
    currentTrips(userId),
    manualMarksFor(userId),
  ]);
  const derived = await countriesForTrips(trips);
  return mergeMarks(derived, manual);
}

export async function travelMapsFor(userIds: string[]): Promise<Map<string, TravelMap>> {
  const maps = new Map<string, TravelMap>();
  if (userIds.length === 0) return maps;

  const [memberships, marks] = await Promise.all([
    db
      .select({ userId: tripMembership.userId, id: trip.id, endDate: trip.endDate })
      .from(tripMembership)
      .innerJoin(trip, eq(trip.id, tripMembership.tripId))
      .where(and(inArray(tripMembership.userId, userIds), isNull(tripMembership.deletedAt), isNull(trip.deletedAt)))
      .limit(LIMITS.tripsPerUser * userIds.length)
      .all(),
    db
      .select({ userId: userCountryMark.userId, countryCode: userCountryMark.countryCode, state: userCountryMark.state })
      .from(userCountryMark)
      .where(inArray(userCountryMark.userId, userIds))
      .all(),
  ]);

  const trips = new Map(memberships.map((m) => [m.id, { id: m.id, endDate: m.endDate }]));
  const byTrip = await countriesByTrip([...trips.values()]);

  for (const userId of userIds) {
    const derived: Record<string, MapState> = {};
    for (const m of memberships.filter((row) => row.userId === userId)) {
      for (const [code, state] of Object.entries(byTrip.get(m.id) ?? {})) {
        derived[code] = strongest(derived[code], state);
      }
    }
    const manual: Record<string, CountryMarkState> = {};
    for (const mark of marks.filter((row) => row.userId === userId)) {
      const code = readCountryCode(mark.countryCode);
      if (code) manual[code] = mark.state;
    }
    maps.set(userId, mergeMarks(derived, manual));
  }
  return maps;
}

export async function setManualMark(
  userId: string,
  countryCode: string,
  state: CountryMarkState,
): Promise<void> {
  await db
    .insert(userCountryMark)
    .values({ userId, countryCode, state })
    .onConflictDoUpdate({
      target: [userCountryMark.userId, userCountryMark.countryCode],
      set: { state, lastModifiedAt: new Date() },
    });
}

export async function clearManualMark(
  userId: string,
  countryCode: string,
): Promise<void> {
  await db
    .delete(userCountryMark)
    .where(
      and(
        eq(userCountryMark.userId, userId),
        eq(userCountryMark.countryCode, countryCode),
      ),
    );
}

export async function derivedStateFor(
  userId: string,
  countryCode: string,
): Promise<MapState | undefined> {
  const derived = await countriesForTrips(await currentTrips(userId));
  return derived[countryCode];
}

