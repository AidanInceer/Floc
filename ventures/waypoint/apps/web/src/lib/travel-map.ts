/**
 * The travel map (ticket 95) — which countries a person has been to, and which
 * they want to go to.
 *
 * The one decision that shapes this whole file: **trip marks are derived on
 * read and never stored.** Green is triggered by `hasEnded` — by *time
 * passing*, not by a write — so there is no event to materialise on short of a
 * cron job, and the fan-out (a trip ends, a day gains a place, a place is
 * deleted, a membership changes, an archive, a restore) would each have to
 * remember to recompute. Deriving costs two queries and is always right.
 *
 * What *is* stored is the hand-painted marks, in `user_country_mark`, and they
 * win permanently. A `none` row is not the absence of a mark: it's "no, I
 * didn't go", which is how you take back a claim a trip is making on your
 * behalf after its dates have passed.
 *
 * Ideas are deliberately excluded — an idea is a suggestion *in contention*,
 * and "Bali (rejected)" quietly painting your want-to-visit map is a wrong
 * claim about you. Route and Days are where a place stops being a suggestion.
 */
import { and, eq, inArray, isNotNull, isNull } from "drizzle-orm";

import { db } from "@/db";
import { day, dayEvent, place, trip, tripMembership, userCountryMark } from "@/db/schema";
import { readCountryCode } from "@/lib/countries";
import { hasEnded } from "@/lib/dates";
import type { CountryMarkState } from "@/db/schema";

/** What a country can look like on the drawing. Absent means unpainted. */
export type MapState = "green" | "yellow";

export type TravelMap = {
  /** Country code → colour, trips and hand merged. The thing that gets drawn. */
  states: Record<string, MapState>;
  /**
   * The hand-painted rows on their own, `none` included — the editor needs
   * them to know what clicking again should do next.
   */
  manual: Record<string, CountryMarkState>;
  visited: number;
  wantToGo: number;
};

/* -------------------------------------------------------------------------- */
/* The pure half                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Trip marks + hand marks → what's drawn.
 *
 * Two rules, and between them they answer every case that came up:
 *  - **Green beats yellow** when two trips disagree. Been-there outranks
 *    want-to-go, so an upcoming trip can't demote a country you've been to.
 *  - **A hand mark wins outright**, `none` included, and a country carrying one
 *    ignores the trips entirely rather than merging with them.
 */
export function mergeMarks(
  derived: Record<string, MapState>,
  manual: Record<string, CountryMarkState>,
): TravelMap {
  const states: Record<string, MapState> = {};

  for (const [code, state] of Object.entries(derived)) {
    if (code in manual) continue;
    states[code] = state;
  }
  for (const [code, state] of Object.entries(manual)) {
    if (state !== "none") states[code] = state;
  }

  const values = Object.values(states);
  return {
    states,
    manual,
    visited: values.filter((s) => s === "green").length,
    wantToGo: values.filter((s) => s === "yellow").length,
  };
}

/** Green wins — see `mergeMarks`. Used while folding rows together. */
function strongest(a: MapState | undefined, b: MapState): MapState {
  return a === "green" || b === "green" ? "green" : "yellow";
}

/* -------------------------------------------------------------------------- */
/* The loaders                                                                */
/* -------------------------------------------------------------------------- */

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
async function currentTripIds(userId: string): Promise<number[]> {
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
