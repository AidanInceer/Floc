import "server-only";

import { and, asc, eq, inArray, isNull, not, sql } from "drizzle-orm";

import { db } from "@/db";
import { day, dayEvent, document, expense, place, trip } from "@/db/schema";
import type { DayEventType, TransportType } from "@/db/schema";
import { addDays as addDaysToDate, dateRange, isIsoDate } from "@floc/core/dates/dates";
import { Refusal } from "@floc/core/errors/refusal";
import { orderEvents } from "@floc/core/itinerary/event-order";
import { MAX_TRIP_DAYS, windowProblem, type DayLoad } from "@floc/core/trip/trip-window";
import { capRequiredText, capText } from "@floc/core/text/text";
import { assertRoom, bounded, LIMITS } from "@/server/limits";
import { touch } from "@/server/audit";
import { refresh } from "@/server/freshness";
import { recordActivity, type Tx } from "@/server/notifications/activity";
import { tripHref } from "@floc/core/notifications/notification-href";
import type { TripPatch } from "@/server/trips/trips";

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

export async function listDayIds(tripId: number): Promise<number[]> {
  return (await listDays(tripId)).map((d) => d.id);
}

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

export async function setTripWindow(
  tripId: number,
  start: string | null,
  end: string | null,
  by: string,
  fields: Omit<TripPatch, "startDate" | "endDate"> = {},
): Promise<void> {
  const problem = windowProblem(start, end);
  if (problem) throw new Refusal(problem);
  const dates = dateRange(start, end);

  await db.transaction(async (tx) => {
    await tx
      .update(trip)
      .set({ ...fields, startDate: start, endDate: end, ...touch() })
      .where(and(eq(trip.id, tripId), isNull(trip.deletedAt)));

    const surplus = await tx
      .select({ id: day.id })
      .from(day)
      .where(
        and(
          eq(day.tripId, tripId),
          isNull(day.deletedAt),
          dates.length ? not(inArray(day.date, dates)) : undefined,
        ),
      )
      .limit(LIMITS.days)
      .all();

    if (surplus.length) {
      const ids = surplus.map((d) => d.id);
      const now = new Date();
      const gone = { deletedAt: now, lastModifiedAt: now };
      const events = await tx
        .update(dayEvent)
        .set(gone)
        .where(and(inArray(dayEvent.dayId, ids), isNull(dayEvent.deletedAt)))
        .returning({ id: dayEvent.id })
        .all();
      await tx.update(day).set(gone).where(inArray(day.id, ids));
      await tx.update(expense).set({ dayId: null }).where(inArray(expense.dayId, ids));
      await tx.update(document).set({ dayId: null }).where(inArray(document.dayId, ids));
      if (events.length) {
        await tx
          .update(document)
          .set({ dayEventId: null })
          .where(inArray(document.dayEventId, events.map((e) => e.id)));
      }
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
  countryCode: string | null;
};

export async function listRouteDays(tripId: number): Promise<RouteDay[]> {
  const rows = await db
    .select({
      dayId: day.id,
      date: day.date,
      overnightPlaceId: day.overnightPlaceId,
      placeName: place.name,
      lat: place.lat,
      lng: place.lng,
      countryCode: place.countryCode,
    })
    .from(day)
    .leftJoin(place, eq(place.id, day.overnightPlaceId))
    .where(and(eq(day.tripId, tripId), isNull(day.deletedAt)))
    .orderBy(asc(day.date))
    .limit(LIMITS.days)
    .all();
  return bounded(rows, "days", `trip ${tripId}`);
}

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

export type DayTransport = { mode: TransportType; time: string | null; endTime: string | null };

export async function transportByDay(tripId: number): Promise<Map<number, DayTransport>> {
  const rows = await db
    .select({ dayId: dayEvent.dayId, transportType: dayEvent.transportType, time: dayEvent.time, endTime: dayEvent.endTime })
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

  const byDay = new Map<number, DayTransport>();
  for (const r of rows) {
    if (r.transportType && !byDay.has(r.dayId)) byDay.set(r.dayId, { mode: r.transportType, time: r.time, endTime: r.endTime });
  }
  return byDay;
}

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

  for (const r of rows) if (!out.has(r.tripId)) out.set(r.tripId, r.placeName);
  return out;
}

export async function ensureDays(
  tripId: number,
  dates: string[],
  run: Pick<Tx, "select" | "insert" | "update"> = db,
): Promise<void> {
  if (dates.length === 0) return;

  const existing = await run
    .select({ id: day.id, date: day.date, deletedAt: day.deletedAt })
    .from(day)
    .where(and(eq(day.tripId, tripId), inArray(day.date, dates)))
    .limit(LIMITS.days)
    .all();

  const removed = existing.filter((d) => d.deletedAt !== null).map((d) => d.id);
  if (removed.length) {
    const now = new Date();
    await run
      .update(dayEvent)
      .set({ deletedAt: now, lastModifiedAt: now })
      .where(and(inArray(dayEvent.dayId, removed), isNull(dayEvent.deletedAt)));
    await run
      .update(day)
      .set({ deletedAt: null, overnightPlaceId: null, lastModifiedAt: now })
      .where(inArray(day.id, removed));
  }

  const covered = new Set(existing.map((d) => d.date));
  const missing = dates.filter((d) => !covered.has(d));
  if (missing.length) {
    await run.insert(day).values(missing.map((date) => ({ tripId, date })));
  }
}

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

async function liveDayDates(tripId: number): Promise<string[]> {
  const rows = await db.select({ date: day.date }).from(day).where(and(eq(day.tripId, tripId), isNull(day.deletedAt)));
  return rows.map((r) => r.date);
}

export async function eventCount(dayId: number): Promise<number> {
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

export async function insertEvent(dayId: number, input: EventFields, countSoFar?: number): Promise<number> {
  const count = countSoFar ?? (await eventCount(dayId));
  assertRoom("eventsPerDay", count);
  const row = await db
    .insert(dayEvent)
    .values({ dayId, orderIndex: count, ...eventValues(input) })
    .returning({ id: dayEvent.id })
    .get();
  return row.id;
}

export async function updateEventFields(
  eventId: number,
  input: EventFields,
): Promise<void> {
  await db
    .update(dayEvent)
    .set({ ...eventValues(input), ...touch() })
    .where(and(eq(dayEvent.id, eventId), isNull(dayEvent.deletedAt)));
}

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

export async function moveEventToDay(
  eventId: number,
  toDayId: number,
  order: { target: number[]; source: number[] },
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .update(dayEvent)
      .set({ dayId: toDayId, ...touch() })
      .where(and(eq(dayEvent.id, eventId), isNull(dayEvent.deletedAt)));
    for (const ids of [order.target, order.source]) {
      for (const [i, id] of ids.entries()) {
        await tx
          .update(dayEvent)
          .set({ orderIndex: i })
          .where(and(eq(dayEvent.id, id), isNull(dayEvent.deletedAt)));
      }
    }
  });
}

export async function rebaseEventOrder(ids: number[]): Promise<void> {
  await Promise.all(
    ids.map((id, i) =>
      db
        .update(dayEvent)
        .set({ orderIndex: i })
        .where(and(eq(dayEvent.id, id), isNull(dayEvent.deletedAt))),
    ),
  );
}

export async function extendTripDays(
  target: { id: number; startDate: string | null; endDate: string | null },
  afterDate: string,
  count: number,
  by: string,
): Promise<void> {
  if (!isIsoDate(afterDate) || !Number.isInteger(count) || count < 1) {
    throw new Refusal("Pick a day and how many to add.");
  }
  if (count > MAX_TRIP_DAYS) throw new Refusal("Keep a trip to a year or less.");
  const dates: string[] = [];
  let cursor = afterDate;
  for (let i = 0; i < count; i++) {
    cursor = addDaysToDate(cursor, 1);
    dates.push(cursor);
  }
  if (dates.length === 0) return;
  const held = new Set(await liveDayDates(target.id));
  assertRoom("days", held.size, dates.filter((d) => !held.has(d)).length);

  const last = dates[dates.length - 1];
  const movesTheWindow = Boolean(target.startDate && target.endDate && last > target.endDate);
  if (movesTheWindow) {
    const problem = windowProblem(target.startDate, last);
    if (problem) throw new Refusal(problem);
  }

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
