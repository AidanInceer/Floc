"use server";

/**
 * Day/day_event mutations (ticket 15). Open to all members, not admin-only
 * (ticket 01 step 7). Last-write-wins (ticket 12) — no version check.
 * SQL lives in `server/itinerary.ts` (ticket 108); nothing here imports `@/db`.
 */
import type { DayEventType, TransportType } from "@/db/schema";
import { requireTripAccess } from "@/server/access";
import { resolveEventPlace } from "../place-actions";
import { applyOvernight, type OvernightPlaceInput } from "@/server/itinerary/overnight";
import { insertAt, permuteEventSlots } from "@floc/core/event-order";
import {
  applyEventSlots,
  extendTripDays,
  insertEvent,
  listDayIds,
  listEventSlots,
  moveEventToDay,
  rescheduleEvent as moveEventTo,
  rebaseEventOrder,
  softDeleteDay,
  softDeleteEvent,
  updateEventFields,
  type EventFields,
} from "@/server/itinerary/itinerary";
import { refresh } from "@/server/freshness";

export async function addDays(tripId: number, afterDate: string, count: number) {
  const access = await requireTripAccess(tripId);
  await extendTripDays(access.trip, afterDate, count);
}

/** Soft-deletes a single day row; its events go with it (hidden by the day's own filter). */
export async function removeDay(tripId: number, dayId: number) {
  const access = await requireTripAccess(tripId);
  const target = await access.day(dayId);
  await softDeleteDay(target.id);
  refresh({ kind: "itinerary", tripId: access.trip.id });
}

/**
 * Where the group sleeps, for a run of days (ticket 141). The rules live in
 * `server/overnight.ts` (ticket 308) so the phone reaches them through the API.
 */
export async function setDayOvernight(
  tripId: number,
  startDate: string,
  endDate: string,
  place: OvernightPlaceInput | null,
) {
  const access = await requireTripAccess(tripId);
  if (await applyOvernight(access.trip.id, startDate, endDate, place)) {
    refresh({ kind: "itinerary", tripId: access.trip.id });
  }
}

export async function addEvent(tripId: number, dayId: number, input: EventFields) {
  const access = await requireTripAccess(tripId);
  const target = await access.day(dayId);
  await insertEvent(target.id, input);
  refresh({ kind: "itinerary", tripId: access.trip.id });
}

export async function updateEvent(
  tripId: number,
  eventId: number,
  input: EventFields,
) {
  const access = await requireTripAccess(tripId);
  const target = await access.event(eventId);
  await updateEventFields(target.id, input);
  refresh({ kind: "itinerary", tripId: access.trip.id });
}

export async function deleteEvent(tripId: number, eventId: number) {
  const access = await requireTripAccess(tripId);
  const target = await access.event(eventId);
  await softDeleteEvent(target.id);
  refresh({ kind: "itinerary", tripId: access.trip.id });
}

/**
 * Drops an event into a different position within its day.
 *
 * The times don't move — the *events* do, between the day's existing slots.
 * Same trade a day drag makes with the trip's dates; lets a day stay
 * time-ordered and hand-arrangeable at once.
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

  refresh({ kind: "itinerary", tripId: access.trip.id });
}

/**
 * Dropping an event into a gap — one action behind both "put it here in this
 * day" and "put it here in *that* day", since from the hand's point of view
 * they're the same gesture.
 *
 * Within a day it's a permutation of the slots, so the run the event passed
 * over shifts to close the space. Across days there's no permutation to
 * make — the target list grows — so the event keeps its own time and the
 * target day re-sorts around it, rather than overwriting whichever time it
 * happened to land next to.
 *
 * Trip and destination day come first, so Days can `.bind(null, access.trip.id,
 * dayId)` (ticket 117, S11).
 */
async function insertEventAt(
  tripId: number,
  toDayId: number,
  eventId: number,
  fromDayId: number,
  index: number,
) {
  const access = await requireTripAccess(tripId);

  // Both days must be this trip's — otherwise a way to reach another group's
  // itinerary by id (rule 5).
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

  // Event changes day first, so the target's re-base sees it there. No
  // locking, no rejection (rule 7).
  await moveEventToDay(eventId, toDayId);
  await rebaseEventOrder(target);
  await rebaseEventOrder(source.filter((e) => e.id !== eventId).map((e) => e.id));

  refresh({ kind: "itinerary", tripId: access.trip.id });
}

/**
 * Dragging an all-day event to another day (ticket 103). Goes through
 * `insertEventAt` rather than `rescheduleEvent`, which has no time to invent —
 * appended to the target's tail since the all-day strip has no order to aim at.
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
 * Dropping an event somewhere on the calendar grid (ticket 103) — one entry
 * point behind every gesture that changes *when* an event is, since they all
 * come out as the same three facts: a day, a start and an end. Times are
 * re-validated here rather than trusted from the client, since the action is
 * reachable without the grid.
 */
export async function rescheduleEvent(
  tripId: number,
  eventId: number,
  toDayId: number,
  time: string,
  endTime: string | null,
) {
  const access = await requireTripAccess(tripId);

  // Both ends must be this trip's (rule 5).
  const target = await access.event(eventId);
  const toDay = await access.day(toDayId);

  const start = readClockTime(time);
  if (!start) return;

  await moveEventTo(target.id, toDay.id, start, readClockTime(endTime));

  refresh({ kind: "itinerary", tripId: access.trip.id });
}

/**
 * `HH:MM` and nothing else (ticket 113). `24:00` is accepted as an *end* — the
 * grid's bottom edge — but `timing` in the aggregate refuses it as a start.
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
 * What the add/edit event sheet posts (ticket 117, S11). One entry point for
 * both: `eventId` tells them apart. Day and event id ride in the form rather
 * than being bound (ticket 103) — both are client state (which block was
 * clicked/opened) — and are checked against the trip below like a bound id would be.
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
