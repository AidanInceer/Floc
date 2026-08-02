"use server";

/**
 * Day/day_event mutations (ticket 15). Open to all members, not admin-only
 * (ticket 01 step 7). Blanket last-write-wins (ticket 12) — no version check
 * before any update.
 *
 * Every line of SQL that used to live here is now in `server/itinerary.ts`
 * (ticket 108): this file decides *who may do what and what it means*, and the
 * aggregate decides how it's stored, what's filtered, what's bounded and what's
 * revalidated. Nothing here imports `@/db`.
 */
import { requireTripAccess } from "@/server/access";
import { addDays as addDaysToDate } from "@/lib/dates";
import { insertAt, permuteEventSlots, swapItems } from "@/lib/event-order";
import {
  applyEventSlots,
  ensureDays,
  insertEvent,
  listDayIds,
  listEventSlots,
  moveEventToDay,
  moveItem,
  permuteDayContents,
  rebaseEventOrder,
  revalidateItinerary,
  softDeleteDay,
  softDeleteEvent,
  updateEventFields,
  type EventFields,
} from "@/server/itinerary";
import { refreshUnlocks } from "@/server/unlocks";

/*
 * The trip joins that used to live here as local `requireDay` / `requireEvent`
 * helpers are now `access.day()` / `access.event()` on the scope object
 * (ticket 106) — same guarantee, but no longer something each actions file has
 * to remember to write for itself.
 */

/**
 * Drops a day into a different position in the itinerary.
 *
 * The dates don't move — the *plan* does. Day rows are keyed by (trip, date),
 * so "swap Tuesday and Wednesday" means Wednesday's overnight place and events
 * now happen on Tuesday's date and vice versa. Expenses stay on the date they
 * were spent; see src/server/itinerary.ts.
 */
export async function reorderDays(tripId: number, from: number, to: number) {
  const access = await requireTripAccess(tripId);

  const ids = await listDayIds(access.trip.id);
  await permuteDayContents(access.trip.id, moveItem(ids, from, to));

  revalidateItinerary(access.trip.id);
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

  await ensureDays(access.trip.id, dates);

  await refreshUnlocks(access.trip.id);
  revalidateItinerary(access.trip.id);
}

/** Soft-deletes a single day row; its events go with it (hidden by the day's own filter). */
export async function removeDay(tripId: number, dayId: number) {
  const access = await requireTripAccess(tripId);
  const target = await access.day(dayId);
  await softDeleteDay(target.id);
  revalidateItinerary(access.trip.id);
}

/*
 * No `setDayNotes`: the per-day notes box is gone, along with `day.notes`.
 * Notes belong to the thing they describe — an event has `note` for its details
 * and a `note`-table thread for the conversation about it.
 */

export async function addEvent(tripId: number, dayId: number, input: EventFields) {
  const access = await requireTripAccess(tripId);
  const target = await access.day(dayId);
  await insertEvent(target.id, input);
  revalidateItinerary(access.trip.id);
}

export async function updateEvent(
  tripId: number,
  eventId: number,
  input: EventFields,
) {
  const access = await requireTripAccess(tripId);
  const target = await access.event(eventId);
  await updateEventFields(target.id, input);
  revalidateItinerary(access.trip.id);
}

export async function deleteEvent(tripId: number, eventId: number) {
  const access = await requireTripAccess(tripId);
  const target = await access.event(eventId);
  await softDeleteEvent(target.id);
  revalidateItinerary(access.trip.id);
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

  await applyEventSlots(
    permuteEventSlots(await listEventSlots(access.trip.id, dayId), newOrder),
  );

  revalidateItinerary(access.trip.id);
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
  const access = await requireTripAccess(tripId);

  const order = (await listEventSlots(access.trip.id, dayId)).map((e) => e.id);
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
  const dayIds = new Set(await listDayIds(access.trip.id));
  if (!dayIds.has(fromDayId) || !dayIds.has(toDayId)) return;

  if (fromDayId === toDayId) {
    const order = (await listEventSlots(access.trip.id, toDayId)).map((e) => e.id);
    if (!order.includes(eventId)) return;
    await reorderEvents(tripId, toDayId, insertAt(order, eventId, index));
    return;
  }

  const source = await listEventSlots(access.trip.id, fromDayId);
  if (!source.some((e) => e.id === eventId)) return;

  const target = insertAt(
    (await listEventSlots(access.trip.id, toDayId)).map((e) => e.id),
    eventId,
    index,
  );

  // The move and the re-basing are one write each, in order: the event changes
  // day first so the target's re-base sees it there. Last-write-wins as ever —
  // no locking, no rejection (rule 7).
  await moveEventToDay(eventId, toDayId);
  await rebaseEventOrder(target);
  await rebaseEventOrder(source.filter((e) => e.id !== eventId).map((e) => e.id));

  // The threads follow for free: `note` rows are scoped to the event id, which
  // hasn't changed. Expenses don't follow — they're scoped to the date the
  // money was spent on, not to the plan (see `permuteDayContents`).
  revalidateItinerary(access.trip.id);
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
  const access = await requireTripAccess(tripId);

  const order = (await listEventSlots(access.trip.id, dayId)).map((e) => e.id);
  const idx = order.indexOf(eventId);
  const to = direction === "up" ? idx - 1 : idx + 1;
  if (idx === -1 || to < 0 || to >= order.length) return;

  await reorderEvents(tripId, dayId, moveItem(order, idx, to));
}
