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
import type { DayEventType, TransportType } from "@/db/schema";
import { requireTripAccess } from "@/server/access";
import { resolveEventPlace } from "../place-actions";
import { addDays as addDaysToDate } from "@/lib/dates";
import { insertAt, permuteEventSlots } from "@/lib/event-order";
import {
  applyEventSlots,
  ensureDays,
  insertEvent,
  listDayIds,
  listEventSlots,
  moveEventToDay,
  moveItem,
  rescheduleEvent as moveEventTo,
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

/*
 * No `swapEvents` and no `moveEvent` any more (ticket 103). Both were list
 * gestures — "trade these two rows and their times", "nudge this row up one" —
 * and the calendar has neither rows nor a position to nudge between. What
 * replaced them is `rescheduleEvent` above: on a grid you say *when*, and the
 * order follows from the clock. `swapItems` and `permuteEventSlots` stay in
 * `lib/event-order.ts`, still used by the within-a-day case of `insertEventAt`.
 */

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
/**
 * Trip and destination day first, so Days can hand this to the drag list with
 * `.bind(null, access.trip.id, dayId)` (ticket 117, S11). The old order forced an
 * inline `"use server"` closure on the page, which captured the whole
 * day-with-events object for the closure's lifetime.
 */
export async function insertEventAt(
  tripId: number,
  toDayId: number,
  eventId: number,
  fromDayId: number,
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
    await reorderEvents(access.trip.id, toDayId, insertAt(order, eventId, index));
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
 * Dragging an **all-day** event to another day (ticket 103).
 *
 * All-day is the one thing on the calendar with no time to drop, so it can't go
 * through `rescheduleEvent` — that would have to invent a start time to write.
 * A change of day carrying the times over untouched is exactly what
 * `insertEventAt` already does, so this is that, appended to the target day's
 * tail rather than dropped at a position: the all-day strip has no order to aim
 * at.
 */
export async function moveEventToAnotherDay(
  tripId: number,
  eventId: number,
  fromDayId: number,
  toDayId: number,
) {
  await insertEventAt(tripId, toDayId, eventId, fromDayId, Number.MAX_SAFE_INTEGER);
}

/**
 * Dropping an event somewhere on the calendar grid (ticket 103).
 *
 * The one action behind every gesture that changes *when* an event is: dragged
 * to another time, dragged to another day, resized by its bottom edge, or
 * nudged with the arrow keys. They all come out as the same three facts — a
 * day, a start and an end — so they are one entry point and not four.
 *
 * The times arrive from the client already snapped to the quarter hour
 * (`lib/calendar.ts`), and are re-read here anyway: the action is reachable
 * without the grid, and `HH:MM` is the only shape the column may hold.
 */
export async function rescheduleEvent(
  tripId: number,
  eventId: number,
  toDayId: number,
  time: string,
  endTime: string | null,
) {
  const access = await requireTripAccess(tripId);

  // Both ends of the drag must be this trip's, or the gesture would be a way
  // to reach into another group's itinerary by id (rule 5).
  const target = await access.event(eventId);
  const toDay = await access.day(toDayId);

  const start = readClockTime(time);
  if (!start) return;

  await moveEventTo(target.id, toDay.id, start, readClockTime(endTime));

  revalidateItinerary(access.trip.id);
}

/**
 * `HH:MM` and nothing else — ticket 113's validate-at-the-door, applied to the
 * one field a drag writes. `24:00` is accepted as an *end*: it is the grid's
 * bottom edge, and `timing` in the aggregate is what refuses it as a start by
 * dropping any end that isn't after its start.
 */
function readClockTime(value: string | null): string | null {
  if (!value) return null;
  const m = /^(\d{2}):(\d{2})$/.exec(value);
  if (!m) return null;
  const [h, min] = [Number(m[1]), Number(m[2])];
  if (h > 24 || min > 59 || (h === 24 && min !== 0)) return null;
  return value;
}

/**
 * What the add/edit event sheet posts (ticket 117, S11).
 *
 * This was an inline `"use server"` closure inside `days/page.tsx`, which is
 * the one place the convention says a mutation must not be. One entry point
 * covers both the add and the edit: the sheet is the same form either way and
 * `eventId` is what tells them apart, so a second near-identical action would
 * only be a second place to forget a field.
 *
 * The day and the event id ride in the form rather than being bound (ticket
 * 103). On the calendar, *which* day and *which* event the dialog is editing
 * are client state — the day you clicked, the block you opened — so binding
 * them would mean the server pre-rendering one bound action per day per mode.
 * Both are checked against the trip below exactly as a bound id would be.
 */
export async function submitEvent(tripId: number, formData: FormData) {
  const dayId = Number(formData.get("dayId"));
  if (!Number.isInteger(dayId)) return;
  const rawEventId = String(formData.get("eventId") ?? "");
  const eventId = rawEventId ? Number(rawEventId) : null;
  if (eventId !== null && !Number.isInteger(eventId)) return;

  const title = String(formData.get("title") ?? "").trim();
  // The input is `required`, so an empty title only arrives from a client with
  // validation off. Drop it rather than write a nameless event.
  if (!title) return;

  const lat = formData.get("placeLat");
  const lng = formData.get("placeLng");
  const placeId = await resolveEventPlace({
    providerId: String(formData.get("placeProviderId") ?? "") || null,
    name: String(formData.get("placeName") ?? ""),
    lat: lat ? Number(lat) : null,
    lng: lng ? Number(lng) : null,
    countryCode: String(formData.get("placeCountryCode") ?? "") || null,
  });

  const fields = {
    type: String(formData.get("type") ?? "activity") as DayEventType,
    title,
    placeId,
    transportType: (String(formData.get("transportType") ?? "") || null) as
      | TransportType
      | null,
    time: String(formData.get("time") ?? "") || null,
    endTime: String(formData.get("endTime") ?? "") || null,
    allDay: formData.get("allDay") === "on",
    note: String(formData.get("note") ?? "") || null,
  };

  if (eventId) await updateEvent(tripId, eventId, fields);
  else await addEvent(tripId, dayId, fields);
}
