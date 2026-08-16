/**
 * The travel map's loaders (ticket 95) — queries behind `lib/travel-map.ts`,
 * which holds the shape/merge rules and the "derived on read, never stored"
 * decision. Ideas are deliberately excluded: an idea is a suggestion in
 * contention, and "Bali (rejected)" painting the map would misrepresent it.
 */
import "server-only";

import { and, eq, inArray, isNotNull, isNull } from "drizzle-orm";

import { db } from "@/db";
import { day, dayEvent, place, trip, tripMembership, userCountryMark } from "@/db/schema";
import { readCountryCode } from "@/lib/countries";
import { hasEnded } from "@/lib/dates";
import { mergeMarks, strongest, type MapState, type TravelMap } from "@/lib/travel-map";
import { bounded, LIMITS } from "@/server/limits";
import type { CountryMarkState } from "@/db/schema";

/**
 * The countries a set of trips puts on the map, and in what colour. Split out
 * from `travelMapFor` since the leave/kick prompt asks the same question about
 * one trip. Archived trips count (filing, not forgetting); soft-deleted ones don't (rule 8).
 */
export async function countriesForTrips(
  tripIds: number[],
): Promise<Record<string, MapState>> {
  const out: Record<string, MapState> = {};
  for (const perTrip of (await countriesByTrip(tripIds)).values()) {
    for (const [code, state] of Object.entries(perTrip)) {
      out[code] = strongest(out[code], state);
    }
  }
  return out;
}

/**
 * The same read, kept split by trip (ticket 114) — `pendingMapPrompts` used to
 * call `countriesForTrips([id])` once per row in a loop (N+1); merging across
 * trips is cheap and belongs to the caller that wants it merged.
 */
export async function countriesByTrip(
  tripIds: number[],
): Promise<Map<number, Record<string, MapState>>> {
  const byTrip = new Map<number, Record<string, MapState>>();
  if (tripIds.length === 0) return byTrip;

  const trips = await db
    .select({ id: trip.id, endDate: trip.endDate })
    .from(trip)
    .where(and(inArray(trip.id, tripIds), isNull(trip.deletedAt)))
    .limit(LIMITS.tripsPerUser)
    .all();
  if (trips.length === 0) return byTrip;
  bounded(trips, "tripsPerUser", "travel map");

  const ids = trips.map((t) => t.id);
  // Undated is yellow, never green: hasEnded(null) is false (rule 9 — no dates isn't finished).
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
    // No country (pre-ticket-95 place, or typed during a Nominatim outage) → doesn't reach the map (rule 11).
    const code = readCountryCode(row.countryCode);
    const state = code ? colour.get(row.tripId) : undefined;
    if (!code || !state) continue;

    const perTrip = byTrip.get(row.tripId) ?? {};
    perTrip[code] = strongest(perTrip[code], state);
    byTrip.set(row.tripId, perTrip);
  }

  return byTrip;
}

/** The trips whose itineraries currently speak for someone. */
export async function currentTripIds(userId: string): Promise<number[]> {
  const rows = await db
    .select({ tripId: tripMembership.tripId })
    .from(tripMembership)
    .where(and(eq(tripMembership.userId, userId), isNull(tripMembership.deletedAt)))
    .all();
  return rows.map((r) => r.tripId);
}

export async function manualMarksFor(
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

export type MapPrompt = {
  tripId: number;
  tripName: string;
  /** Named, not counted — "3 countries" isn't an answerable question. */
  countries: { code: string; state: MapState }[];
};

/**
 * Questions left parked by trips this person is no longer on (ticket 95). A
 * trip with no known countries asks nothing — its flag stays set and
 * invisible rather than being cleared behind the member's back.
 */
export async function pendingMapPrompts(userId: string): Promise<MapPrompt[]> {
  const rows = await db
    .select({ tripId: trip.id, name: trip.name, promptAt: tripMembership.mapPromptAt })
    .from(tripMembership)
    .innerJoin(trip, eq(trip.id, tripMembership.tripId))
    .where(
      and(
        eq(tripMembership.userId, userId),
        isNotNull(tripMembership.mapPromptAt),
        isNull(trip.deletedAt),
      ),
    )
    .all();
  if (rows.length === 0) return [];

  const byTrip = await countriesByTrip(rows.map((r) => r.tripId)); // one read, not one per trip (ticket 114)

  const out: MapPrompt[] = [];
  for (const row of rows) {
    const entries = Object.entries(byTrip.get(row.tripId) ?? {}).map(
      ([code, state]) => ({ code, state }),
    );
    if (entries.length === 0) continue;
    out.push({ tripId: row.tripId, tripName: row.name, countries: entries });
  }
  return out;
}

/** One person's whole map. The only thing a page should call. */
export async function travelMapFor(userId: string): Promise<TravelMap> {
  const [tripIds, manual] = await Promise.all([
    currentTripIds(userId),
    manualMarksFor(userId),
  ]);
  const derived = await countriesForTrips(tripIds);
  return mergeMarks(derived, manual);
}

// `user_country_mark` writes (ticket 108) — kept here rather than
// `profile/actions.ts` since a hand mark permanently overrides a derived one,
// and paint/reject/take-back only make sense beside the derivation.

/** Paint a country. Always written, even where a trip already says the same. */
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

/** Take a hand mark back entirely, letting the trips speak again. */
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

/** What the trips would say about one country with any hand mark ignored. */
export async function derivedStateFor(
  userId: string,
  countryCode: string,
): Promise<MapState | undefined> {
  const derived = await countriesForTrips(await currentTripIds(userId));
  return derived[countryCode];
}

/** Converts a leaving trip's countries into hand marks (ticket 95). Never overwrites an existing hand mark, including a `none` — that's a decision, not a gap. */
export async function keepMarksFromTrip(
  userId: string,
  tripId: number,
): Promise<void> {
  const countries = await countriesForTrips([tripId]);
  for (const [countryCode, state] of Object.entries(countries)) {
    await db
      .insert(userCountryMark)
      .values({ userId, countryCode, state })
      .onConflictDoNothing();
  }
}
