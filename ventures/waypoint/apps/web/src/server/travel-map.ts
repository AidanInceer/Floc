/**
 * The travel map's loaders (ticket 95) — the queries behind
 * `lib/travel-map.ts`, which holds the shape and the merge rules and is the
 * half a Client Component may import. Read that file first: the decision that
 * trip marks are *derived on read and never stored* is written down there, and
 * it is what every query here exists to serve.
 *
 * Ideas are deliberately excluded — an idea is a suggestion *in contention*,
 * and "Bali (rejected)" quietly painting your want-to-visit map is a wrong
 * claim about you. Route and Days are where a place stops being a suggestion.
 */
import "server-only";

import { and, eq, inArray, isNotNull, isNull } from "drizzle-orm";

import { db } from "@/db";
import { day, dayEvent, place, trip, tripMembership, userCountryMark } from "@/db/schema";
import { readCountryCode } from "@/lib/countries";
import { hasEnded } from "@/lib/dates";
import { mergeMarks, strongest, type MapState, type TravelMap } from "@/lib/travel-map";
import type { CountryMarkState } from "@/db/schema";

/**
 * The countries a set of trips puts on the map, and in what colour. Split out
 * from `travelMapFor` because the leave/kick prompt asks the same question
 * about exactly one trip.
 *
 * Archived trips count: archiving is filing, not forgetting. Soft-deleted ones
 * don't, like everywhere else (non-negotiable 8).
 */
export async function countriesForTrips(
  tripIds: number[],
): Promise<Record<string, MapState>> {
  const out: Record<string, MapState> = {};
  if (tripIds.length === 0) return out;

  const trips = await db
    .select({ id: trip.id, endDate: trip.endDate })
    .from(trip)
    .where(and(inArray(trip.id, tripIds), isNull(trip.deletedAt)))
    .all();
  if (trips.length === 0) return out;

  const ids = trips.map((t) => t.id);
  // Undated is yellow, never green: `hasEnded(null)` is false, which is the
  // right answer under non-negotiable 9 — no dates is normal, not finished.
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
    // A place geocoded before ticket 95, or typed free-hand during a Nominatim
    // outage, has no country — it simply doesn't reach the map (rule 11).
    const code = readCountryCode(row.countryCode);
    const state = code ? colour.get(row.tripId) : undefined;
    if (!code || !state) continue;
    out[code] = strongest(out[code], state);
  }

  return out;
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
  /** What would be kept — named, because "3 countries" is not an answerable question. */
  countries: { code: string; state: MapState }[];
};

/**
 * The questions left parked by trips this person is no longer on (ticket 95).
 *
 * A trip whose countries are all unknown — no geocoded places, or none from
 * before `place.country_code` existed — asks nothing, because there is nothing
 * to keep. Its flag stays set and invisible rather than being cleared behind
 * the member's back.
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

  const out: MapPrompt[] = [];
  for (const row of rows) {
    const countries = await countriesForTrips([row.tripId]);
    const entries = Object.entries(countries).map(([code, state]) => ({ code, state }));
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

/* ------------------------------------------------------ the hand marks */
/*
 * The `user_country_mark` writes (ticket 108). They are here rather than in
 * `profile/actions.ts` for the reason at the top of `lib/travel-map.ts`: a hand
 * mark wins over a derived one, permanently, and the three ways of saying so —
 * paint, reject, take back — only make sense next to the derivation they
 * override.
 */

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

/**
 * Converts a leaving trip's countries into hand marks — the only place any
 * conversion happens (ticket 95). Never overwrites something already said by
 * hand, including a `none`, which is a decision about that country and not a
 * gap to fill.
 */
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
