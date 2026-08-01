"use server";

/**
 * Route mutations (ticket 15). Route edits are itinerary edits — same `day`
 * rows Days uses — so every write here is really "create/edit day rows and
 * their overnight place", not a separate "stop" entity (there isn't one).
 * Open to all members, not admin-only (ticket 01 step 7).
 */
import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { day, dayEvent, type TransportType } from "@/db/schema";
import { requireTripAccess, requireUser } from "@/lib/access";
import { dateRange } from "@/lib/dates";
import { searchPlaces, upsertPlace } from "@/lib/geocoding";
import { moveItem, permuteDayContents } from "@/lib/itinerary";
import { deriveStops } from "@/lib/stops";
import { refreshUnlocks, touch } from "@/lib/unlocks";

/**
 * Thin server-action wrapper so <PlacePicker> (client) can call Nominatim
 * search without a client-side fetch to our own API — only "use server"
 * functions may cross the client/server prop boundary.
 *
 * Signed-in only (ticket 104) — a `"use server"` export is a public endpoint,
 * and unGated this was an open geocoding proxy against our Nominatim budget.
 * `requireUser` rather than `requireTripAccess`: the picker searches before a
 * trip is in scope, and place rows are not trip-scoped data.
 */
export async function searchPlacesAction(query: string) {
  await requireUser();
  return searchPlaces(query);
}

/**
 * Points every date in `dates` at `placeId`, creating the day rows that don't
 * exist yet.
 *
 * Batched deliberately: the obvious shape here is a per-date
 * select-then-update/insert, but that is two serial round trips *per night* —
 * a fortnight-long stop paid ~28 of them. Reading the whole span up front and
 * writing it as one bulk update plus one bulk insert makes it three, whatever
 * the span. Same-per-date semantics: an existing live row is re-pointed, a
 * date with no live row is inserted (a soft-deleted row on that date still
 * collides on `day_trip_date_idx`, exactly as before).
 */
async function writeSpan(tripId: number, dates: string[], placeId: number | null) {
  if (dates.length === 0) return;

  const existing = await db
    .select({ id: day.id, date: day.date })
    .from(day)
    .where(
      and(eq(day.tripId, tripId), inArray(day.date, dates), isNull(day.deletedAt)),
    )
    .all();

  const covered = new Set(existing.map((d) => d.date));
  const missing = dates.filter((d) => !covered.has(d));

  await Promise.all([
    existing.length
      ? db
          .update(day)
          .set({ overnightPlaceId: placeId, ...touch() })
          .where(inArray(day.id, existing.map((d) => d.id)))
      : undefined,
    missing.length
      ? db
          .insert(day)
          .values(missing.map((date) => ({ tripId, date, overnightPlaceId: placeId })))
      : undefined,
  ]);
}

/**
 * Adds a stop by creating (or re-pointing) `day` rows for a date span.
 * Dates already covered by an existing day are updated in place rather than
 * duplicated — `day` has a unique (trip, date) index.
 */
export async function addStop(
  tripId: number,
  input: {
    startDate: string;
    endDate: string;
    placeName: string;
    providerId?: string | null;
    lat?: number | null;
    lng?: number | null;
    countryCode?: string | null;
  },
) {
  const access = await requireTripAccess(tripId);
  const placeId = await upsertPlace({
    providerId: input.providerId ?? null,
    name: input.placeName,
    lat: input.lat,
    lng: input.lng,
    countryCode: input.countryCode,
  });

  await writeSpan(access.trip.id, dateRange(input.startDate, input.endDate), placeId);

  await refreshUnlocks(access.trip.id);
  revalidatePath(`/trip/${access.trip.id}/route`);
  revalidatePath(`/trip/${access.trip.id}/days`);
}

/** Changes the overnight place for one or more existing day rows. */
export async function setOvernightPlace(
  tripId: number,
  dayIds: number[],
  input: {
    placeName: string;
    providerId?: string | null;
    lat?: number | null;
    lng?: number | null;
    countryCode?: string | null;
  },
) {
  const access = await requireTripAccess(tripId);
  const placeId = await upsertPlace({
    providerId: input.providerId ?? null,
    name: input.placeName,
    lat: input.lat,
    lng: input.lng,
    countryCode: input.countryCode,
  });

  await db
    .update(day)
    .set({ overnightPlaceId: placeId, ...touch() })
    .where(and(eq(day.tripId, access.trip.id), inArray(day.id, dayIds)));

  revalidatePath(`/trip/${access.trip.id}/route`);
  revalidatePath(`/trip/${access.trip.id}/days`);
}

/**
 * Moves a stop to a different date span, keeping its place.
 *
 * "Reordering" a stop is really re-dating it — a stop is derived from
 * consecutive days sharing an overnight place (rule 3), so there is no stored
 * row to drag. This clears the place off the days the stop used to cover and
 * writes it onto the days the new span covers, creating any that don't exist.
 * Days that appear in both spans are simply rewritten, so shrinking a stop by
 * a night doesn't churn the days it keeps.
 *
 * Last-write-wins (rule 7): if the new span overlaps a *neighbouring* stop,
 * this takes those days. That's the honest outcome of "these dates are now
 * Lisbon" — the two stops merge into one on the next render.
 */
export async function setStopDates(
  tripId: number,
  dayIds: number[],
  input: { startDate: string; endDate: string },
) {
  const access = await requireTripAccess(tripId);
  if (!input.startDate || !input.endDate || input.endDate < input.startDate) return;

  const current = await db
    .select({ placeId: day.overnightPlaceId })
    .from(day)
    .where(and(eq(day.tripId, access.trip.id), inArray(day.id, dayIds)))
    .get();
  const placeId = current?.placeId ?? null;

  await db
    .update(day)
    .set({ overnightPlaceId: null, ...touch() })
    .where(and(eq(day.tripId, access.trip.id), inArray(day.id, dayIds)));

  await writeSpan(access.trip.id, dateRange(input.startDate, input.endDate), placeId);

  await refreshUnlocks(access.trip.id);
  revalidatePath(`/trip/${access.trip.id}/route`);
  revalidatePath(`/trip/${access.trip.id}/days`);
}

/**
 * Drops a stop into a different position in the sequence.
 *
 * There is no stored row to drag (rule 3), so this permutes what happens on
 * the trip's dates: the stops are re-laid over the same run of days in the new
 * order, each keeping its own number of nights and taking whatever dates that
 * lands it on. A two-night stop moved in front of a three-night one therefore
 * changes both stops' dates — which is the point of moving it.
 *
 * Events travel with their stop; expenses stay on their date. See
 * src/lib/itinerary.ts for why.
 */
export async function reorderStops(tripId: number, from: number, to: number) {
  const access = await requireTripAccess(tripId);

  const days = await db
    .select({
      dayId: day.id,
      date: day.date,
      overnightPlaceId: day.overnightPlaceId,
    })
    .from(day)
    .where(and(eq(day.tripId, access.trip.id), isNull(day.deletedAt)))
    .orderBy(asc(day.date))
    .all();

  const stops = deriveStops(
    days.map((d) => ({
      dayId: d.dayId,
      date: d.date,
      overnightPlaceId: d.overnightPlaceId,
      overnightPlaceName: null,
    })),
  );

  const legs = await loadLegEvents(stops);
  const next = moveItem(stops, from, to);

  await permuteDayContents(access.trip.id, next.flatMap((s) => s.dayIds));
  await reanchorLegEvents(stops, next, days.map((d) => d.dayId), legs);

  revalidatePath(`/trip/${access.trip.id}/route`);
  revalidatePath(`/trip/${access.trip.id}/days`);
}

/**
 * The travel between two stops belongs to the *pair*, not to either end
 * (ticket 82). The event itself lives on the arrival stop's first day, so a
 * plain permute carries it off with whichever stop it happened to be sitting
 * on: swap Madrid and Lisbon and the car that joined them arrives at the top
 * of the trip, where there is nothing before it to travel from — the leg looks
 * as though it lost its mode.
 *
 * So a reorder records the legs first, then re-anchors them afterwards: any
 * pair of stops still next to each other keeps its travel, on whichever of the
 * two is now second. A pair pulled apart doesn't — its event stays with the
 * stop it was on, which is the only other place it could honestly go.
 *
 * Nothing about this needs a column of its own. The mode is still exactly
 * `day_event.transport_type`; what a reorder fixes up is which day the row
 * hangs off, and a `leg` table would be the stored "stop" rule 3 rules out,
 * one relationship further along.
 */
const pairKey = (a: number, b: number) =>
  `${Math.min(a, b)}-${Math.max(a, b)}`;

/** First transport event on each stop's first day, keyed by the pair it joins. */
async function loadLegEvents(stops: { dayIds: number[] }[]) {
  const arrivalDays = stops.slice(1).map((s) => s.dayIds[0]);
  const legs = new Map<string, number>();
  if (arrivalDays.length === 0) return legs;

  const rows = await db
    .select({ id: dayEvent.id, dayId: dayEvent.dayId })
    .from(dayEvent)
    .where(
      and(
        inArray(dayEvent.dayId, arrivalDays),
        eq(dayEvent.type, "transport"),
        isNull(dayEvent.deletedAt),
      ),
    )
    .orderBy(asc(dayEvent.orderIndex))
    .all();

  const firstByDay = new Map<number, number>();
  for (const r of rows) if (!firstByDay.has(r.dayId)) firstByDay.set(r.dayId, r.id);

  for (const [i, stop] of stops.entries()) {
    if (i === 0) continue;
    const eventId = firstByDay.get(stop.dayIds[0]);
    if (eventId) legs.set(pairKey(i - 1, i), eventId);
  }
  return legs;
}

/** Moves each surviving leg's event onto the day its arrival stop now starts on. */
async function reanchorLegEvents(
  stops: { dayIds: number[] }[],
  next: { dayIds: number[] }[],
  /** The trip's live day ids, in date order — dates don't move, contents do. */
  dayIdsByDate: number[],
  legs: Map<string, number>,
) {
  if (legs.size === 0) return;

  const positionOf = new Map(stops.map((s, i) => [s, i]));
  const writes: Promise<unknown>[] = [];
  let offset = 0;

  for (const [k, stop] of next.entries()) {
    if (k > 0) {
      const key = pairKey(positionOf.get(next[k - 1])!, positionOf.get(stop)!);
      const eventId = legs.get(key);
      const arrivalDayId = dayIdsByDate[offset];
      if (eventId && arrivalDayId) {
        writes.push(
          db
            .update(dayEvent)
            .set({ dayId: arrivalDayId, ...touch() })
            .where(eq(dayEvent.id, eventId)),
        );
      }
    }
    offset += stop.dayIds.length;
  }

  await Promise.all(writes);
}

/**
 * Removes a stop: clears the overnight place on its days but keeps the `day`
 * rows themselves — the days still exist on the itinerary, just unplaced.
 */
export async function removeStop(tripId: number, dayIds: number[]) {
  const access = await requireTripAccess(tripId);

  await db
    .update(day)
    .set({ overnightPlaceId: null, ...touch() })
    .where(and(eq(day.tripId, access.trip.id), inArray(day.id, dayIds)));

  revalidatePath(`/trip/${access.trip.id}/route`);
  revalidatePath(`/trip/${access.trip.id}/days`);
}

/**
 * Sets how the group gets to a stop (ticket 82). The mode is not stored on the
 * route — a stop isn't stored at all (rule 3) — so this writes the same
 * `day_event` row Days owns: the first transport event on the arrival stop's
 * first day, which is exactly the row the Route page reads the leg's mode back
 * off.
 *
 * Two deliberate limits. An existing transport event is only re-typed — its
 * title, time and note are the group's, written on Days, and a picker on
 * another tab has no business rewriting them. And there is no "clear": setting
 * a leg back to unplanned would mean deleting an event somebody wrote on Days,
 * which is a destructive edit hiding inside a dropdown. Removing it stays a
 * Days action.
 */
export async function setLegTransport(
  tripId: number,
  dayId: number,
  mode: TransportType,
) {
  const access = await requireTripAccess(tripId);

  // The day must belong to this trip — `dayId` arrives from the client.
  const arrival = await db
    .select({ id: day.id })
    .from(day)
    .where(
      and(
        eq(day.id, dayId),
        eq(day.tripId, access.trip.id),
        isNull(day.deletedAt),
      ),
    )
    .get();
  if (!arrival) return;

  const existing = await db
    .select({ id: dayEvent.id })
    .from(dayEvent)
    .where(
      and(
        eq(dayEvent.dayId, dayId),
        eq(dayEvent.type, "transport"),
        isNull(dayEvent.deletedAt),
      ),
    )
    .orderBy(asc(dayEvent.orderIndex))
    .all();

  if (existing.length > 0) {
    await db
      .update(dayEvent)
      .set({ transportType: mode, ...touch() })
      .where(eq(dayEvent.id, existing[0].id));
  } else {
    const [{ count } = { count: 0 }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(dayEvent)
      .where(and(eq(dayEvent.dayId, dayId), isNull(dayEvent.deletedAt)));

    await db.insert(dayEvent).values({
      dayId,
      orderIndex: count,
      type: "transport",
      title: TRANSPORT_TITLES[mode],
      transportType: mode,
      // No time: Route knows the leg happens, not when. All-day is what the
      // itinerary already means by "on that day, not at a time" — the group
      // fills the rest in on Days.
      allDay: true,
    });
  }

  revalidatePath(`/trip/${access.trip.id}/route`);
  revalidatePath(`/trip/${access.trip.id}/days`);
}

/** The title a leg-created event lands on Days with — editable there. */
const TRANSPORT_TITLES: Record<TransportType, string> = {
  flight: "Flight to the next stop",
  train: "Train to the next stop",
  car: "Drive to the next stop",
  ferry: "Ferry to the next stop",
  other: "Travel to the next stop",
};
