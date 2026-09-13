/**
 * The itinerary aggregate — every read and write of `day` and `day_event`
 * (ticket 108). Route and Days are two views of the same rows, one aggregate.
 *
 * Soft-delete (rule 8) filtered here only, not in `app/`; exceptions:
 * `ensureDays` and `setTripWindow`, each noted where they are.
 * Day-first (rule 3): no stored stop, no `order_index` on a day — a "move"
 * is a permutation of day *contents* between date rows, not a drag of dates.
 * Expenses (`expense.day_id`) and comment threads (on `day_event`) deliberately
 * don't travel with a day when it moves. Last-write-wins (rule 7): no locking.
 */
import "server-only";

import { and, asc, eq, inArray, isNull, not, sql } from "drizzle-orm";

import { db } from "@/db";
import { day, dayEvent, expense, place, trip } from "@/db/schema";
import type { DayEventType, TransportType } from "@/db/schema";
import { addDays as addDaysToDate, dateRange } from "@floc/core/dates/dates";
import { orderEvents } from "@floc/core/itinerary/event-order";
import type { DayLoad } from "@floc/core/trip/trip-window";
import { capRequiredText, capText } from "@floc/core/text/text";
import { bounded, LIMITS } from "@/server/limits";
import { touch } from "@/server/audit";
import { refresh } from "@/server/freshness";
import { recordActivity, type Tx } from "@/server/notifications/activity";
import { tripHref } from "@floc/core/notifications/notification-href";

export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) {
    return items;
  }
  const next = items.slice();
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export type ItineraryDay = {
  id: number;
  date: string;
  overnightPlaceId: number | null;
};

export async function listDays(tripId: number): Promise<ItineraryDay[]> {
  const rows = await db
    .select({ id: day.id, date: day.date, overnightPlaceId: day.overnightPlaceId })
    .from(day)
    .where(and(eq(day.tripId, tripId), isNull(day.deletedAt)))
    .orderBy(asc(day.date))
    .limit(LIMITS.days)
    .all();
  return bounded(rows, "days", `trip ${tripId}`);
}

/** Just the ids, in date order. */
export async function listDayIds(tripId: number): Promise<number[]> {
  return (await listDays(tripId)).map((d) => d.id);
}

/**
 * Every live day with its event count (ticket 140). Dates tab loads it once and
 * does the arithmetic client-side (`lib/trip-window.ts`) rather than a round
 * trip per drag.
 */
export async function listDayLoads(tripId: number): Promise<DayLoad[]> {
  const rows = await db
    .select({
      date: day.date,
      events: sql<number>`count(${dayEvent.id})`,
    })
    .from(day)
    .leftJoin(
      dayEvent,
      and(eq(dayEvent.dayId, day.id), isNull(dayEvent.deletedAt)),
    )
    .where(and(eq(day.tripId, tripId), isNull(day.deletedAt)))
    .groupBy(day.id)
    .orderBy(asc(day.date))
    .limit(LIMITS.days)
    .all();
  return bounded(rows, "days", `trip ${tripId}`);
}

/**
 * Makes the itinerary match the trip's window (ticket 140): a day per date in
 * the window, nothing outside it. An empty window removes every day ("Reset
 * dates") — callers confirm with the user first, per rule 7.
 *
 * Surplus days are **hard-deleted** (second exception to rule 8, same reason as
 * `ensureDays`): a soft-deleted row still occupies the `(trip, date)` unique
 * index, so soft-deleting a shrink's cut days would permanently block reusing
 * those dates. The three writes are spelled out rather than left to `ON
 * DELETE`, since FK enforcement is only a connection pragma — and expenses are
 * deliberately detached, not deleted, with their day (`expense.day_id` nullable
 * for this).
 */
export async function setTripWindow(
  tripId: number,
  start: string | null,
  end: string | null,
  by: string,
): Promise<void> {
  const dates = dateRange(start, end);

  await db.transaction(async (tx) => {
    await tx
      .update(trip)
      .set({ startDate: start, endDate: end, ...touch() })
      .where(and(eq(trip.id, tripId), isNull(trip.deletedAt)));

    // Unfiltered on deletedAt — same reason the delete is hard, below.
    const surplus = await tx
      .select({ id: day.id })
      .from(day)
      .where(
        and(
          eq(day.tripId, tripId),
          dates.length ? not(inArray(day.date, dates)) : undefined,
        ),
      )
      .limit(LIMITS.days)
      .all();

    if (surplus.length) {
      const ids = surplus.map((d) => d.id);
      await tx.update(expense).set({ dayId: null }).where(inArray(expense.dayId, ids));
      await tx.delete(dayEvent).where(inArray(dayEvent.dayId, ids));
      await tx.delete(day).where(inArray(day.id, ids));
    }

    await ensureDays(tripId, dates, tx);
    await recordActivity(tx, {
      kind: "trip_dates_changed",
      tripId,
      actorId: by,
      subjectId: null,
      href: tripHref(tripId, "dates"),
      affected: [],
    });
  });

  refresh({ kind: "tripWindow", tripId });
}

/* ---------------------------------------------- the reads the tabs render */
// Three separate reads, not one loadDaysTab() — Days, Route, Money and the
// invite teaser each want a different slice (ticket 118).

export type DayWithEvents = {
  id: number;
  date: string;
  overnightPlaceId: number | null;
  overnightPlaceName: string | null;
  events: DayEventRow[];
};

export type DayEventRow = {
  id: number;
  dayId: number;
  orderIndex: number;
  type: DayEventType;
  title: string | null;
  transportType: TransportType | null;
  time: string | null;
  endTime: string | null;
  allDay: boolean;
  note: string | null;
  placeName: string | null;
};

/**
 * The whole itinerary, days in date order with events attached. The events
 * query joins through `day` to scope by trip — it used to filter in JS after
 * selecting every `day_event` row, which got slower with every trip added.
 */
export async function listDaysWithEvents(tripId: number): Promise<DayWithEvents[]> {
  const [days, events] = await Promise.all([
    db
      .select({
        id: day.id,
        date: day.date,
        overnightPlaceId: day.overnightPlaceId,
        overnightPlaceName: place.name,
      })
      .from(day)
      .leftJoin(place, eq(place.id, day.overnightPlaceId))
      .where(and(eq(day.tripId, tripId), isNull(day.deletedAt)))
      .orderBy(asc(day.date))
      .limit(LIMITS.days)
      .all(),
    db
      .select({
        id: dayEvent.id,
        dayId: dayEvent.dayId,
        orderIndex: dayEvent.orderIndex,
        type: dayEvent.type,
        title: dayEvent.title,
        transportType: dayEvent.transportType,
        time: dayEvent.time,
        endTime: dayEvent.endTime,
        allDay: dayEvent.allDay,
        note: dayEvent.note,
        placeName: place.name,
      })
      .from(dayEvent)
      .innerJoin(day, eq(day.id, dayEvent.dayId))
      .leftJoin(place, eq(place.id, dayEvent.placeId))
      .where(
        and(
          eq(day.tripId, tripId),
          isNull(day.deletedAt),
          isNull(dayEvent.deletedAt),
        ),
      )
      .limit(LIMITS.days * LIMITS.eventsPerDay)
      .all(),
  ]);

  return bounded(days, "days", `trip ${tripId}`).map((d) => ({
    ...d,
    // order_index only breaks ties among untimed events — see lib/event-order.ts.
    events: orderEvents(events.filter((e) => e.dayId === d.id)),
  }));
}

export type RouteDay = {
  dayId: number;
  date: string;
  overnightPlaceId: number | null;
  placeName: string | null;
  lat: number | null;
  lng: number | null;
};

/** Days with where they're slept, in date order (rule 3: a stop is never stored). */
export async function listRouteDays(tripId: number): Promise<RouteDay[]> {
  const rows = await db
    .select({
      dayId: day.id,
      date: day.date,
      overnightPlaceId: day.overnightPlaceId,
      placeName: place.name,
      lat: place.lat,
      lng: place.lng,
    })
    .from(day)
    .leftJoin(place, eq(place.id, day.overnightPlaceId))
    .where(and(eq(day.tripId, tripId), isNull(day.deletedAt)))
    .orderBy(asc(day.date))
    .limit(LIMITS.days)
    .all();
  return bounded(rows, "days", `trip ${tripId}`);
}

/**
 * The places this trip's days already point at (ticket 141) — lets a Nominatim
 * outage's typed-name places (no provider id for `upsertPlace` to dedupe on)
 * get reused instead of minting a duplicate "Barcelona" row.
 */
export async function listOvernightPlaces(
  tripId: number,
): Promise<{ id: number; name: string }[]> {
  const rows = await db
    .selectDistinct({ id: place.id, name: place.name })
    .from(day)
    .innerJoin(place, eq(place.id, day.overnightPlaceId))
    .where(and(eq(day.tripId, tripId), isNull(day.deletedAt), isNull(place.deletedAt)))
    .limit(LIMITS.days)
    .all();
  return bounded(rows, "days", `trip ${tripId} overnight places`);
}

/**
 * The travel mode of each day's first transport event, by day id (ticket 78).
 * No route to store a mode on, so it's read off day events; first event of the
 * day wins (a taxi-then-ferry day reads as one leg, started by the earliest).
 */
export async function transportModesByDay(
  tripId: number,
): Promise<Map<number, TransportType>> {
  const rows = await db
    .select({ dayId: dayEvent.dayId, transportType: dayEvent.transportType })
    .from(dayEvent)
    .innerJoin(day, eq(day.id, dayEvent.dayId))
    .where(
      and(
        eq(day.tripId, tripId),
        eq(dayEvent.type, "transport"),
        isNull(dayEvent.deletedAt),
        isNull(day.deletedAt),
      ),
    )
    .orderBy(asc(dayEvent.orderIndex))
    .limit(LIMITS.days * LIMITS.eventsPerDay)
    .all();

  const byDay = new Map<number, TransportType>();
  for (const r of rows) {
    if (r.transportType && !byDay.has(r.dayId)) byDay.set(r.dayId, r.transportType);
  }
  return byDay;
}

/**
 * Where each of these trips *is*, for the Place sort on `/trips` (ticket 70).
 * No destination column (rule 3), so it's the earliest day with an overnight
 * place — one query for the whole list, not one per card.
 */
export async function firstOvernightPlaceByTrip(
  tripIds: number[],
): Promise<Map<number, string>> {
  const out = new Map<number, string>();
  if (tripIds.length === 0) return out;

  const rows = await db
    .select({ tripId: day.tripId, date: day.date, placeName: place.name })
    .from(day)
    .innerJoin(place, eq(place.id, day.overnightPlaceId))
    .where(
      and(
        inArray(day.tripId, tripIds),
        isNull(day.deletedAt),
        isNull(place.deletedAt),
      ),
    )
    .orderBy(asc(day.date))
    .limit(LIMITS.tripsPerUser * LIMITS.days)
    .all();

  // Ordered by date, so the first row seen per trip is its earliest.
  for (const r of rows) if (!out.has(r.tripId)) out.set(r.tripId, r.placeName);
  return out;
}

/**
 * Extends the trip by creating day rows for `dates` that don't have one.
 * Existence check deliberately unfiltered on `deletedAt` (rule 8 exception) —
 * a soft-deleted row still occupies the (trip, date) unique index.
 */
export async function ensureDays(
  tripId: number,
  dates: string[],
  run: Pick<Tx, "select" | "insert"> = db,
): Promise<void> {
  if (dates.length === 0) return;

  const existing = await run
    .select({ date: day.date })
    .from(day)
    .where(and(eq(day.tripId, tripId), inArray(day.date, dates)))
    .limit(LIMITS.days)
    .all();

  const covered = new Set(existing.map((d) => d.date));
  const missing = dates.filter((d) => !covered.has(d));
  if (missing.length) {
    await run.insert(day).values(missing.map((date) => ({ tripId, date })));
  }
}

/**
 * Re-points a known set of the trip's days at a place (or at nothing).
 * Filters `deletedAt` (ticket 115, rule 8) — without it, a stale dayId from a
 * page rendered before a delete would resurrect the day as a half-state.
 */
export async function setOvernightPlaceOn(
  tripId: number,
  dayIds: number[],
  placeId: number | null,
): Promise<void> {
  if (dayIds.length === 0) return;
  await db
    .update(day)
    .set({ overnightPlaceId: placeId, ...touch() })
    .where(
      and(eq(day.tripId, tripId), inArray(day.id, dayIds), isNull(day.deletedAt)),
    );
}

/** Its events go with it, hidden by the day's own filter — not deleted themselves. */
export async function softDeleteDay(dayId: number, by: string): Promise<void> {
  await db.transaction(async (tx) => {
    const gone = await tx
      .update(day)
      .set({ deletedAt: new Date(), ...touch() })
      .where(and(eq(day.id, dayId), isNull(day.deletedAt)))
      .returning({ tripId: day.tripId })
      .get();
    if (!gone) return;
    await recordActivity(tx, {
      kind: "days_removed",
      tripId: gone.tripId,
      actorId: by,
      subjectId: null,
      href: tripHref(gone.tripId, "days"),
      affected: [],
    });
  });
}

/**
 * A day's events, ordered (`lib/event-order.ts`). Joins through `day` so a
 * foreign `dayId` reads as an empty day rather than another group's itinerary
 * (ticket 104) — every reorder derives its write ids from this scoped read.
 */
export async function listEventSlots(tripId: number, dayId: number) {
  const rows = await db
    .select({
      id: dayEvent.id,
      time: dayEvent.time,
      endTime: dayEvent.endTime,
      allDay: dayEvent.allDay,
      orderIndex: dayEvent.orderIndex,
    })
    .from(dayEvent)
    .innerJoin(day, eq(day.id, dayEvent.dayId))
    .where(
      and(
        eq(dayEvent.dayId, dayId),
        eq(day.tripId, tripId),
        isNull(dayEvent.deletedAt),
        isNull(day.deletedAt),
      ),
    )
    .limit(LIMITS.eventsPerDay)
    .all();
  return orderEvents(bounded(rows, "eventsPerDay", `day ${dayId}`));
}

/** The next `order_index` for this day. */
async function eventCount(dayId: number): Promise<number> {
  const [{ count } = { count: 0 }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(dayEvent)
    .where(and(eq(dayEvent.dayId, dayId), isNull(dayEvent.deletedAt)));
  return count;
}

export type EventFields = {
  type: DayEventType;
  title: string;
  placeId?: number | null;
  transportType?: TransportType | null;
  time?: string | null;
  endTime?: string | null;
  allDay?: boolean;
  note?: string | null;
};

/**
 * Reconciles the three time fields so they can't contradict each other. All-day
 * wins outright (a leftover start is stale, not a preference); an end not
 * strictly after the start is dropped, since `HH:MM` can't say "next morning"
 * (rule 10) — an event past midnight has no representation here.
 */
function timing(input: Pick<EventFields, "time" | "endTime" | "allDay">) {
  if (input.allDay) return { time: null, endTime: null, allDay: true };
  const time = input.time || null;
  const endTime = input.endTime || null;
  return {
    time,
    endTime: time && endTime && endTime > time ? endTime : null,
    allDay: false,
  };
}

function eventValues(input: EventFields) {
  return {
    type: input.type,
    title: capRequiredText(input.title, "eventTitle"),
    placeId: input.placeId ?? null,
    transportType: input.type === "transport" ? input.transportType ?? null : null,
    ...timing(input),
    note: capText(input.note, "eventNote"),
  };
}

export async function insertEvent(dayId: number, input: EventFields): Promise<void> {
  await db
    .insert(dayEvent)
    .values({ dayId, orderIndex: await eventCount(dayId), ...eventValues(input) });
}

// Filters deletedAt so a stale id cannot edit a deleted event (ticket 115).
export async function updateEventFields(
  eventId: number,
  input: EventFields,
): Promise<void> {
  await db
    .update(dayEvent)
    .set({ ...eventValues(input), ...touch() })
    .where(and(eq(dayEvent.id, eventId), isNull(dayEvent.deletedAt)));
}

// Filtered so a second delete is a no-op, not a re-stamp of deleted_at.
export async function softDeleteEvent(eventId: number): Promise<void> {
  await db
    .update(dayEvent)
    .set({ deletedAt: new Date(), ...touch() })
    .where(and(eq(dayEvent.id, eventId), isNull(dayEvent.deletedAt)));
}

export async function applyEventSlots(
  writes: {
    id: number;
    time: string | null;
    endTime: string | null;
    allDay: boolean;
    orderIndex: number;
  }[],
): Promise<void> {
  // Issued together, not awaited one at a time (ticket 114) — one write per
  // event id, no id twice, so nothing here can race anything else here.
  await Promise.all(
    writes.map((w) =>
      db
        .update(dayEvent)
        .set({
          time: w.time,
          endTime: w.endTime,
          allDay: w.allDay,
          orderIndex: w.orderIndex,
          ...touch(),
        })
        .where(and(eq(dayEvent.id, w.id), isNull(dayEvent.deletedAt))),
    ),
  );
}

/**
 * Drops an event at an exact time on an exact day — a calendar drag (ticket
 * 103), distinct from `applyEventSlots`'s list-position swap: the grid's whole
 * point is that the cursor's time becomes the event's time. `order_index` is
 * left alone — it only broke ties among the untimed.
 */
export async function rescheduleEvent(
  eventId: number,
  toDayId: number,
  time: string,
  endTime: string | null,
): Promise<void> {
  await db
    .update(dayEvent)
    .set({
      dayId: toDayId,
      ...timing({ time, endTime, allDay: false }),
      ...touch(),
    })
    .where(and(eq(dayEvent.id, eventId), isNull(dayEvent.deletedAt)));
}

// Caller checks both days belong to the trip.
export async function moveEventToDay(eventId: number, toDayId: number): Promise<void> {
  await db
    .update(dayEvent)
    .set({ dayId: toDayId, ...touch() })
    .where(eq(dayEvent.id, eventId));
}

export async function rebaseEventOrder(ids: number[]): Promise<void> {
  // One statement per id, all in flight — distinct rows, no ordering between
  // them (ticket 114).
  await Promise.all(
    ids.map((id, i) =>
      db
        .update(dayEvent)
        .set({ orderIndex: i })
        .where(and(eq(dayEvent.id, id), isNull(dayEvent.deletedAt))),
    ),
  );
}

/**
 * Appends `count` days after `afterDate`, moving the trip's end date out with
 * them (ticket 140) — a day past `end_date` is one the Dates tab would next
 * offer to delete, so the two are one write, not two.
 *
 * Only outwards, and only for a trip that already has a window: an undated
 * trip is normal (rule 9) and appending a day doesn't settle it.
 */
export async function extendTripDays(
  target: { id: number; startDate: string | null; endDate: string | null },
  afterDate: string,
  count: number,
  by: string,
): Promise<void> {
  const dates: string[] = [];
  let cursor = afterDate;
  for (let i = 0; i < count; i++) {
    cursor = addDaysToDate(cursor, 1);
    dates.push(cursor);
  }
  if (dates.length === 0) return;

  const last = dates[dates.length - 1];
  const movesTheWindow = Boolean(target.startDate && target.endDate && last > target.endDate);

  await db.transaction(async (tx) => {
    await ensureDays(target.id, dates, tx);
    if (movesTheWindow) {
      await tx
        .update(trip)
        .set({ endDate: last, ...touch() })
        .where(and(eq(trip.id, target.id), isNull(trip.deletedAt)));
    }
    await recordActivity(tx, {
      kind: "days_added",
      tripId: target.id,
      actorId: by,
      subjectId: null,
      href: tripHref(target.id, "days"),
      affected: [],
    });
  });

  refresh({ kind: movesTheWindow ? "tripWindow" : "itinerary", tripId: target.id });
}
