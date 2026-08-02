/**
 * The itinerary aggregate — every read and write of `day` and `day_event`
 * (ticket 108). Route and Days are two views of these same rows, so they are
 * one aggregate with two pages, not two features.
 *
 * What this module owns, and what no `actions.ts` may therefore spell out for
 * itself again:
 *
 * - **Soft-delete (rule 8).** `isNull(deletedAt)` appears here and nowhere in
 *   `app/`. The one deliberate exception is `appendDays`, whose existence check
 *   must *include* soft-deleted rows — they still occupy the (trip, date) unique
 *   index — and which says so at the call site.
 * - **The ceilings.** `LIMITS.days` and `LIMITS.eventsPerDay`, applied on every
 *   list read; see `server/limits.ts` for what happens at one.
 * - **Revalidation.** A day row is on both tabs, so every itinerary write
 *   invalidates both. That pair was written out fifteen times across two files
 *   and is now `revalidateItinerary`.
 * - **The day-first invariant (rule 3).** A stop is derived from consecutive
 *   days sharing an overnight place; there is no stored stop and no
 *   `order_index` on a day. Everything that looks like "move a stop" is a
 *   permutation of day *contents* here.
 *
 * Reordering, in detail: the itinerary is day-first, so there is nothing stored
 * to drag. What moves is a day's *contents* — its overnight place and its events
 * — between day rows whose dates stay exactly where they are. Ten days of a trip
 * stay the same ten dates; only what happens on them is permuted. That is also
 * why a stop's dates change when it moves: a two-night stop dropped in front of
 * a three-night one takes the first two dates of the pair's combined span.
 *
 * What deliberately does NOT travel with a day:
 *
 * - **Expenses.** `expense.day_id` points at a date, and money was spent on the
 *   day it was spent on. Moving the plan doesn't rewrite the receipts.
 * - **Comments.** Threads hang off `day_event` (scope + scope_id), and the
 *   events keep their ids as they move, so every thread arrives with its event
 *   without this module touching the `note` table at all.
 *
 * Last-write-wins (rule 7): two people dragging at once means the second write
 * lands on whatever the first left behind. No locking, no rejection.
 */
import "server-only";

import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { day, dayEvent } from "@/db/schema";
import type { DayEventType, TransportType } from "@/db/schema";
import { orderEvents } from "@/lib/event-order";
import { capRequiredText, capText } from "@/lib/text";
import { bounded, LIMITS } from "@/server/limits";
import { touch } from "@/server/unlocks";

/** Moves one item within an array, returning a new array. */
export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) {
    return items;
  }
  const next = items.slice();
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/**
 * The one revalidation an itinerary write does. Both tabs read the same rows,
 * so refreshing one and not the other is always a bug — which is why the pair
 * is a function and not a convention.
 */
export function revalidateItinerary(tripId: number): void {
  revalidatePath(`/trip/${tripId}/days`);
  revalidatePath(`/trip/${tripId}/route`);
}

export type ItineraryDay = {
  id: number;
  date: string;
  overnightPlaceId: number | null;
};

/** The trip's live days in date order — the spine every other read hangs off. */
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
 * Rewrites the trip's itinerary so that the day identified by `newOrder[i]`
 * ends up on the date currently held by the i-th day.
 *
 * `newOrder` must be a permutation of the trip's live day ids — anything else
 * is ignored rather than half-applied, since a partial permutation would
 * duplicate an event onto two dates.
 */
export async function permuteDayContents(tripId: number, newOrder: number[]) {
  const days = await listDays(tripId);

  if (newOrder.length !== days.length) return;
  const source = new Map(days.map((d) => [d.id, d]));
  if (new Set(newOrder).size !== newOrder.length) return;
  if (newOrder.some((id) => !source.has(id))) return;

  // Everything is read BEFORE anything is written: the loops below write into
  // the same rows they would otherwise be reading from, so a snapshot is what
  // keeps this a permutation rather than a cascade.
  const events = bounded(
    await db
      .select({ id: dayEvent.id, dayId: dayEvent.dayId })
      .from(dayEvent)
      .where(
        and(
          inArray(dayEvent.dayId, days.map((d) => d.id)),
          isNull(dayEvent.deletedAt),
        ),
      )
      .limit(LIMITS.days * LIMITS.eventsPerDay)
      .all(),
    "eventsPerDay",
    `trip ${tripId}`,
  );

  const eventsByDay = new Map<number, number[]>();
  for (const e of events) {
    const list = eventsByDay.get(e.dayId);
    if (list) list.push(e.id);
    else eventsByDay.set(e.dayId, [e.id]);
  }

  // The writes are issued together rather than awaited one at a time: because
  // `newOrder` is a verified permutation of live day ids, every statement below
  // touches a distinct day row and a distinct set of event rows, so nothing
  // here can race anything else here. Awaiting each in turn cost up to 2N
  // serial round trips on a single drag.
  const writes: Promise<unknown>[] = [];

  for (const [i, target] of days.entries()) {
    const from = source.get(newOrder[i])!;
    if (from.id === target.id) continue;

    writes.push(
      db
        .update(day)
        .set({ overnightPlaceId: from.overnightPlaceId, ...touch() })
        .where(eq(day.id, target.id)),
    );

    const moving = eventsByDay.get(from.id);
    if (moving?.length) {
      writes.push(
        db
          .update(dayEvent)
          .set({ dayId: target.id, ...touch() })
          .where(inArray(dayEvent.id, moving)),
      );
    }
  }

  await Promise.all(writes);
}

/**
 * Extends the trip by creating day rows for `dates` that don't have one.
 *
 * The existence check is deliberately *not* filtered on `deletedAt` — the one
 * place in this module that isn't. A soft-deleted row still occupies the
 * (trip, date) unique index, so skipping it is what keeps this idempotent.
 */
export async function ensureDays(tripId: number, dates: string[]): Promise<void> {
  if (dates.length === 0) return;

  const existing = await db
    .select({ date: day.date })
    .from(day)
    .where(and(eq(day.tripId, tripId), inArray(day.date, dates)))
    .limit(LIMITS.days)
    .all();

  const covered = new Set(existing.map((d) => d.date));
  const missing = dates.filter((d) => !covered.has(d));
  if (missing.length) {
    await db.insert(day).values(missing.map((date) => ({ tripId, date })));
  }
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
export async function writeSpan(
  tripId: number,
  dates: string[],
  placeId: number | null,
): Promise<void> {
  if (dates.length === 0) return;

  const existing = await db
    .select({ id: day.id, date: day.date })
    .from(day)
    .where(
      and(eq(day.tripId, tripId), inArray(day.date, dates), isNull(day.deletedAt)),
    )
    .limit(LIMITS.days)
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
 * Re-points a known set of the trip's days at a place (or at nothing).
 *
 * Filters `deletedAt` like a read does (ticket 115). Rule 8 was written as
 * "every *read* filters soft-deletes", and that phrasing is what let this
 * through: without the filter, a stale `dayId` from a page rendered before
 * somebody deleted the day would resurrect it as a half-state — a deleted day
 * that has an overnight place.
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

/** The place a set of days currently points at — the stop's identity when re-dating it. */
export async function overnightPlaceOf(
  tripId: number,
  dayIds: number[],
): Promise<number | null> {
  if (dayIds.length === 0) return null;
  const row = await db
    .select({ placeId: day.overnightPlaceId })
    .from(day)
    .where(
      and(eq(day.tripId, tripId), inArray(day.id, dayIds), isNull(day.deletedAt)),
    )
    .get();
  return row?.placeId ?? null;
}

/** Soft-deletes one day row. Its events go with it, hidden by the day's own filter. */
export async function softDeleteDay(dayId: number): Promise<void> {
  await db
    .update(day)
    .set({ deletedAt: new Date(), ...touch() })
    .where(and(eq(day.id, dayId), isNull(day.deletedAt)));
}

/**
 * A day's events in the order they're shown in — see `lib/event-order.ts`.
 *
 * Takes the trip as well as the day and joins through `day`, so a foreign
 * `dayId` reads as an empty day rather than another group's itinerary (ticket
 * 104). Every reorder derives the ids it writes from this read, which is what
 * makes scoping the *read* enough to scope the writes too — and
 * `permuteEventSlots` refuses a `newOrder` that isn't a permutation of what
 * came back, so a caller cannot smuggle a foreign id in through it either.
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

/** How many live events a day already holds — the next `order_index`. */
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
function timing(input: EventFields) {
  if (input.allDay) return { time: null, endTime: null, allDay: true };
  const time = input.time || null;
  const endTime = input.endTime || null;
  return {
    time,
    endTime: time && endTime && endTime > time ? endTime : null,
    allDay: false,
  };
}

/** The stored shape of an event's editable fields, times already reconciled. */
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

/** Filters `deletedAt` so a stale id cannot edit a deleted event (ticket 115). */
export async function updateEventFields(
  eventId: number,
  input: EventFields,
): Promise<void> {
  await db
    .update(dayEvent)
    .set({ ...eventValues(input), ...touch() })
    .where(and(eq(dayEvent.id, eventId), isNull(dayEvent.deletedAt)));
}

/**
 * Filtered too, so a second delete is a no-op rather than a re-stamp — the
 * `deleted_at` a row carries should be when it was deleted, not when somebody
 * last pressed the button.
 */
export async function softDeleteEvent(eventId: number): Promise<void> {
  await db
    .update(dayEvent)
    .set({ deletedAt: new Date(), ...touch() })
    .where(and(eq(dayEvent.id, eventId), isNull(dayEvent.deletedAt)));
}

/** Applies the slot assignments `permuteEventSlots` worked out. */
export async function applyEventSlots(
  writes: {
    id: number;
    time: string | null;
    endTime: string | null;
    allDay: boolean;
    orderIndex: number;
  }[],
): Promise<void> {
  // Issued together, not awaited one at a time (ticket 114). `permuteEventSlots`
  // hands back one write per event id and no id twice, so nothing here can race
  // anything else here — where a `for await` cost one round trip per event, and
  // a twelve-event day paid twelve of them on a single drag, over HTTP.
  //
  // Last-write-wins across *users* is unchanged (rule 7): two people dragging at
  // once means the second drag lands on whatever the first left behind.
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

/** Moves an event to another day of the same trip. The caller checks both days. */
export async function moveEventToDay(eventId: number, toDayId: number): Promise<void> {
  await db
    .update(dayEvent)
    .set({ dayId: toDayId, ...touch() })
    .where(eq(dayEvent.id, eventId));
}

/**
 * Re-bases `order_index` densely over a list of event ids. It's only a
 * tie-break among the untimed, but keeping it dense keeps it predictable.
 */
export async function rebaseEventOrder(ids: number[]): Promise<void> {
  // One statement per id, all in flight at once — distinct rows, no ordering
  // between them (ticket 114). `insertEventAt` calls this twice per cross-day
  // drag, so it was the same 2N serial cost `permuteDayContents` already avoids.
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
export async function setLegTransportOn(
  tripId: number,
  dayId: number,
  mode: TransportType,
): Promise<void> {
  // The day must belong to this trip — `dayId` arrives from the client.
  const arrival = await db
    .select({ id: day.id })
    .from(day)
    .where(and(eq(day.id, dayId), eq(day.tripId, tripId), isNull(day.deletedAt)))
    .get();
  if (!arrival) return;

  const existing = await firstTransportEvents([dayId]);
  const eventId = existing.get(dayId);

  if (eventId !== undefined) {
    await db
      .update(dayEvent)
      .set({ transportType: mode, ...touch() })
      .where(eq(dayEvent.id, eventId));
    return;
  }

  await db.insert(dayEvent).values({
    dayId,
    orderIndex: await eventCount(dayId),
    type: "transport",
    title: TRANSPORT_TITLES[mode],
    transportType: mode,
    // No time: Route knows the leg happens, not when. All-day is what the
    // itinerary already means by "on that day, not at a time" — the group
    // fills the rest in on Days.
    allDay: true,
  });
}

/** The title a leg-created event lands on Days with — editable there. */
const TRANSPORT_TITLES: Record<TransportType, string> = {
  flight: "Flight to the next stop",
  train: "Train to the next stop",
  car: "Drive to the next stop",
  ferry: "Ferry to the next stop",
  other: "Travel to the next stop",
};

/** The first transport event on each of the given days, by day id. */
export async function firstTransportEvents(
  dayIds: number[],
): Promise<Map<number, number>> {
  const out = new Map<number, number>();
  if (dayIds.length === 0) return out;

  const rows = await db
    .select({ id: dayEvent.id, dayId: dayEvent.dayId })
    .from(dayEvent)
    .where(
      and(
        inArray(dayEvent.dayId, dayIds),
        eq(dayEvent.type, "transport"),
        isNull(dayEvent.deletedAt),
      ),
    )
    .orderBy(asc(dayEvent.orderIndex))
    .limit(LIMITS.days * LIMITS.eventsPerDay)
    .all();

  for (const r of rows) if (!out.has(r.dayId)) out.set(r.dayId, r.id);
  return out;
}
