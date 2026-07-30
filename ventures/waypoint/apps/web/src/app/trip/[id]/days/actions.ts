"use server";

/**
 * Day/day_event mutations (ticket 15). Open to all members, not admin-only
 * (ticket 01 step 7). Blanket last-write-wins (ticket 12) — no version check
 * before any update; `touch()` just keeps `last_modified_at` current for
 * debugging.
 */
import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { day, dayEvent } from "@/db/schema";
import type { DayEventType, TransportType } from "@/db/schema";
import { requireTripAccess } from "@/lib/access";
import { addDays as addDaysToDate } from "@/lib/dates";
import {
  insertAt,
  orderEvents,
  permuteEventSlots,
  swapItems,
} from "@/lib/event-order";
import { moveItem, permuteDayContents } from "@/lib/itinerary";
import { searchPlaces, upsertPlace } from "@/lib/geocoding";
import { refreshUnlocks, touch } from "@/lib/unlocks";

/** Server-action wrapper — see route/actions.ts's twin for why this exists. */
export async function searchPlacesAction(query: string) {
  return searchPlaces(query);
}

/** Resolves a free-text or geocoded place into a `place.id` for an event. */
export async function resolveEventPlace(input: {
  providerId: string | null;
  name: string;
  lat: number | null;
  lng: number | null;
}) {
  if (!input.name.trim()) return null;
  return upsertPlace(input);
}

/**
 * Drops a day into a different position in the itinerary.
 *
 * The dates don't move — the *plan* does. Day rows are keyed by (trip, date),
 * so "swap Tuesday and Wednesday" means Wednesday's overnight place and events
 * now happen on Tuesday's date and vice versa. Expenses stay on the date they
 * were spent; see src/lib/itinerary.ts.
 */
export async function reorderDays(tripId: number, from: number, to: number) {
  const access = await requireTripAccess(tripId);

  const days = await db
    .select({ id: day.id })
    .from(day)
    .where(and(eq(day.tripId, access.trip.id), isNull(day.deletedAt)))
    .orderBy(asc(day.date))
    .all();

  await permuteDayContents(
    access.trip.id,
    moveItem(days.map((d) => d.id), from, to),
  );

  revalidatePath(`/trip/${access.trip.id}/days`);
  revalidatePath(`/trip/${access.trip.id}/route`);
}

/** Extends the trip by appending N days after its current last day. */
export async function addDays(tripId: number, afterDate: string, count: number) {
  const access = await requireTripAccess(tripId);
  const dates: string[] = [];
  let cursor = afterDate;
  for (let i = 0; i < count; i++) {
    cursor = addDaysToDate(cursor, 1);
    dates.push(cursor);
  }

  // One read for the whole span and one insert for whatever's missing, rather
  // than a select-then-insert per day. The existence check is deliberately
  // *not* filtered on `deletedAt`: a soft-deleted row still occupies the
  // (trip, date) unique index, so skipping it is what keeps this idempotent.
  if (dates.length) {
    const existing = await db
      .select({ date: day.date })
      .from(day)
      .where(and(eq(day.tripId, access.trip.id), inArray(day.date, dates)))
      .all();

    const covered = new Set(existing.map((d) => d.date));
    const missing = dates.filter((d) => !covered.has(d));
    if (missing.length) {
      await db
        .insert(day)
        .values(missing.map((date) => ({ tripId: access.trip.id, date })));
    }
  }

  await refreshUnlocks(access.trip.id);
  revalidatePath(`/trip/${access.trip.id}/days`);
  revalidatePath(`/trip/${access.trip.id}/route`);
}

/** Soft-deletes a single day row (and its events cascade via FK on hard delete only — soft-delete is app-level, so events are left orphaned-but-hidden by the day's own deletedAt check in queries). */
export async function removeDay(tripId: number, dayId: number) {
  const access = await requireTripAccess(tripId);
  await db
    .update(day)
    .set({ deletedAt: new Date(), ...touch() })
    .where(and(eq(day.id, dayId), eq(day.tripId, access.trip.id)));
  revalidatePath(`/trip/${access.trip.id}/days`);
  revalidatePath(`/trip/${access.trip.id}/route`);
}

/*
 * No `setDayNotes`: the per-day notes box is gone, along with `day.notes`.
 * Notes belong to the thing they describe — an event has `note` for its details
 * and a `note`-table thread for the conversation about it.
 */

export async function addEvent(
  tripId: number,
  dayId: number,
  input: {
    type: DayEventType;
    title: string;
    placeId?: number | null;
    transportType?: TransportType | null;
    time?: string | null;
    endTime?: string | null;
    allDay?: boolean;
    note?: string | null;
  },
) {
  const access = await requireTripAccess(tripId);

  const [{ count } = { count: 0 }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(dayEvent)
    .where(and(eq(dayEvent.dayId, dayId), isNull(dayEvent.deletedAt)));

  await db.insert(dayEvent).values({
    dayId,
    orderIndex: count,
    type: input.type,
    title: input.title.trim(),
    placeId: input.placeId ?? null,
    transportType: input.type === "transport" ? input.transportType ?? null : null,
    ...timing(input),
    note: input.note || null,
  });

  revalidatePath(`/trip/${access.trip.id}/days`);
}

export async function updateEvent(
  tripId: number,
  eventId: number,
  input: {
    type: DayEventType;
    title: string;
    placeId?: number | null;
    transportType?: TransportType | null;
    time?: string | null;
    endTime?: string | null;
    allDay?: boolean;
    note?: string | null;
  },
) {
  const access = await requireTripAccess(tripId);
  await db
    .update(dayEvent)
    .set({
      type: input.type,
      title: input.title.trim(),
      placeId: input.placeId ?? null,
      transportType: input.type === "transport" ? input.transportType ?? null : null,
      ...timing(input),
      note: input.note || null,
      ...touch(),
    })
    .where(eq(dayEvent.id, eventId));
  revalidatePath(`/trip/${access.trip.id}/days`);
}

export async function deleteEvent(tripId: number, eventId: number) {
  const access = await requireTripAccess(tripId);
  await db
    .update(dayEvent)
    .set({ deletedAt: new Date(), ...touch() })
    .where(eq(dayEvent.id, eventId));
  revalidatePath(`/trip/${access.trip.id}/days`);
}

/**
 * Reconciles the three time fields into a state that can't contradict itself,
 * because the form can offer combinations the day can't hold.
 *
 * All-day wins outright: it means "no start time", so a start left in the box
 * when the checkbox went on is stale, not a preference. An end that isn't
 * strictly after the start is dropped rather than stored — `HH:MM` can't say
 * "next morning" (rule 10: no timezones, no dates on an event), so an event
 * running past midnight has no representation here at all. That gap is real
 * and is on the Day-event planning epic, not papered over with a fake time.
 */
function timing(input: {
  time?: string | null;
  endTime?: string | null;
  allDay?: boolean;
}) {
  if (input.allDay) return { time: null, endTime: null, allDay: true };
  const time = input.time || null;
  const endTime = input.endTime || null;
  return {
    time,
    endTime: time && endTime && endTime > time ? endTime : null,
    allDay: false,
  };
}

/** A day's events in the order they're shown in — see `lib/event-order.ts`. */
async function loadEventSlots(dayId: number) {
  const rows = await db
    .select({
      id: dayEvent.id,
      time: dayEvent.time,
      endTime: dayEvent.endTime,
      allDay: dayEvent.allDay,
      orderIndex: dayEvent.orderIndex,
    })
    .from(dayEvent)
    .where(and(eq(dayEvent.dayId, dayId), isNull(dayEvent.deletedAt)))
    .all();
  return orderEvents(rows);
}

/**
 * Drops an event into a different position within its day.
 *
 * The times don't move — the *events* do, between the day's existing slots, so
 * dragging the 14:00 above the 09:00 hands each the other's time. That's the
 * same trade dragging a day makes with the trip's dates, and it's what lets a
 * day be time-ordered and hand-arrangeable at once: a hand-picked order that
 * fought the clock would be undone by the next time edit.
 */
export async function reorderEvents(
  tripId: number,
  dayId: number,
  newOrder: number[],
) {
  const access = await requireTripAccess(tripId);

  const writes = permuteEventSlots(await loadEventSlots(dayId), newOrder);
  // Last-write-wins (ticket 12): two people dragging at once means the second
  // drag lands on whatever the first left behind.
  for (const w of writes) {
    await db
      .update(dayEvent)
      .set({
        time: w.time,
        endTime: w.endTime,
        allDay: w.allDay,
        orderIndex: w.orderIndex,
        ...touch(),
      })
      .where(eq(dayEvent.id, w.id));
  }

  revalidatePath(`/trip/${access.trip.id}/days`);
}

/**
 * Dropping one event onto another: the two trade places, and with them their
 * times. Nothing between them moves — see `swapItems`.
 */
export async function swapEvents(
  tripId: number,
  dayId: number,
  aId: number,
  bId: number,
) {
  await requireTripAccess(tripId);

  const order = (await loadEventSlots(dayId)).map((e) => e.id);
  const a = order.indexOf(aId);
  const b = order.indexOf(bId);
  if (a === -1 || b === -1) return;

  await reorderEvents(tripId, dayId, swapItems(order, a, b));
}

/**
 * Dropping an event into a gap — the one action behind both "put it here in
 * this day" and "put it here in *that* day", because from the hand's point of
 * view they're the same gesture and it would be strange for one to work and
 * the other not.
 *
 * Within a day it's a permutation of the slots, so the run the event passed
 * over shifts up or down one to close the space. Across days there's no
 * permutation to make — the target list grows — so the event carries its own
 * time over and the target day re-sorts around it. That's the honest option:
 * the alternative is overwriting a time the group agreed with whichever one it
 * happened to land next to.
 */
export async function insertEventAt(
  tripId: number,
  eventId: number,
  fromDayId: number,
  toDayId: number,
  index: number,
) {
  const access = await requireTripAccess(tripId);

  // Both days must be this trip's, or a drag would be a way to reach into
  // another group's itinerary by id (rule 5).
  const days = await db
    .select({ id: day.id })
    .from(day)
    .where(and(eq(day.tripId, access.trip.id), isNull(day.deletedAt)))
    .all();
  const dayIds = new Set(days.map((d) => d.id));
  if (!dayIds.has(fromDayId) || !dayIds.has(toDayId)) return;

  if (fromDayId === toDayId) {
    const order = (await loadEventSlots(toDayId)).map((e) => e.id);
    if (!order.includes(eventId)) return;
    await reorderEvents(tripId, toDayId, insertAt(order, eventId, index));
    return;
  }

  const source = await loadEventSlots(fromDayId);
  if (!source.some((e) => e.id === eventId)) return;

  const target = insertAt(
    (await loadEventSlots(toDayId)).map((e) => e.id),
    eventId,
    index,
  );

  // The move and the re-basing are one write each, in order: the event changes
  // day first so the target's re-base sees it there. Last-write-wins as ever —
  // no locking, no rejection (rule 7).
  await db
    .update(dayEvent)
    .set({ dayId: toDayId, ...touch() })
    .where(eq(dayEvent.id, eventId));

  // `order_index` is a tie-break, so it only decides anything among the
  // untimed — but re-basing the whole list keeps it dense and predictable.
  for (const [i, id] of target.entries()) {
    await db.update(dayEvent).set({ orderIndex: i }).where(eq(dayEvent.id, id));
  }
  for (const [i, e] of source.filter((e) => e.id !== eventId).entries()) {
    await db.update(dayEvent).set({ orderIndex: i }).where(eq(dayEvent.id, e.id));
  }

  // The threads follow for free: `note` rows are scoped to the event id, which
  // hasn't changed. Expenses don't follow — they're scoped to the date the
  // money was spent on, not to the plan (see `permuteDayContents`).
  revalidatePath(`/trip/${access.trip.id}/days`);
}

/**
 * The ↑/↓ buttons, which are the keyboard's way in — a drag handle is
 * mouse-only. One step is a permutation like any other, so it goes through
 * `reorderEvents` rather than growing a second, subtly different reorder.
 */
export async function moveEvent(
  tripId: number,
  dayId: number,
  eventId: number,
  direction: "up" | "down",
) {
  // Gate before the read, not just inside `reorderEvents` — a non-member must
  // not get so far as learning how many events a day has (rule 5).
  await requireTripAccess(tripId);

  const order = (await loadEventSlots(dayId)).map((e) => e.id);
  const idx = order.indexOf(eventId);
  const to = direction === "up" ? idx - 1 : idx + 1;
  if (idx === -1 || to < 0 || to >= order.length) return;

  await reorderEvents(tripId, dayId, moveItem(order, idx, to));
}
