"use server";

/**
 * Day/day_event mutations (ticket 15). Open to all members, not admin-only
 * (ticket 01 step 7). Last-write-wins (ticket 12) — no version check.
 * SQL lives in `server/itinerary.ts` (ticket 108); nothing here imports `@/db`.
 */
import { revalidatePath } from "next/cache";

import type { DayEventType, TransportType } from "@/db/schema";
import { requireTripAccess } from "@/server/access";
import { revalidateTripHeader, setTripDateRange } from "@/server/membership";
import { resolveEventPlace } from "../place-actions";
import { upsertPlace } from "@/server/places";
import { addDays as addDaysToDate, isIsoDate } from "@/lib/dates";
import { capText } from "@/lib/text";
import { insertAt, permuteEventSlots } from "@/lib/event-order";
import {
  applyEventSlots,
  ensureDays,
  insertEvent,
  listDayIds,
  listDays,
  listEventSlots,
  listOvernightPlaces,
  moveEventToDay,
  rescheduleEvent as moveEventTo,
  rebaseEventOrder,
  revalidateItinerary,
  setOvernightPlaceOn,
  softDeleteDay,
  softDeleteEvent,
  updateEventFields,
  type EventFields,
  type ItineraryDay,
} from "@/server/itinerary";

/**
 * Extends the trip by appending N days after its current last day.
 *
 * The window comes with them (ticket 140): a day past `end_date` would be one
 * the Dates tab next offers to delete. Appending a day *is* moving the end
 * date, so this writes both. Nothing here confirms — extending only adds days.
 */
export async function addDays(tripId: number, afterDate: string, count: number) {
  const access = await requireTripAccess(tripId);
  const dates: string[] = [];
  let cursor = afterDate;
  for (let i = 0; i < count; i++) {
    cursor = addDaysToDate(cursor, 1);
    dates.push(cursor);
  }

  await ensureDays(access.trip.id, dates);

  const { startDate, endDate } = access.trip;
  const last = dates[dates.length - 1];
  // Only outwards, and only for a trip with a window already — an undated
  // trip is normal (rule 9) and appending a day doesn't settle it.
  if (startDate && endDate && last > endDate) {
    await setTripDateRange(access.trip.id, startDate, last);
    revalidateTripHeader(access.trip.id);
    revalidatePath(`/trip/${access.trip.id}/dates`);
  }

  revalidateItinerary(access.trip.id);
}

/** Soft-deletes a single day row; its events go with it (hidden by the day's own filter). */
export async function removeDay(tripId: number, dayId: number) {
  const access = await requireTripAccess(tripId);
  const target = await access.day(dayId);
  await softDeleteDay(target.id);
  revalidateItinerary(access.trip.id);
}

/**
 * Where the group sleeps, for a run of days (ticket 141).
 *
 * Decided per *day*: one column, `day.overnight_place_id`, on every day in the
 * span. A stop is still derived and never stored (rule 3) — `deriveStops`
 * groups agreeing runs, nothing here merges them.
 *
 * Writes via `setOvernightPlaceOn`, not a span-creating helper: since ticket
 * 140 the trip's dates own which days exist, so a span running off the end
 * just sets the days it covers rather than growing the itinerary sideways.
 */
export type OvernightPlaceInput =
  /** A place this trip's itinerary already points at — an extend keeps its pin. */
  | { placeId: number }
  /** A fresh pick from the search, or a name typed when the provider is down. */
  | {
      name: string;
      providerId?: string | null;
      lat?: number | null;
      lng?: number | null;
      countryCode?: string | null;
    };

export async function setDayOvernight(
  tripId: number,
  startDate: string,
  endDate: string,
  place: OvernightPlaceInput | null,
) {
  const access = await requireTripAccess(tripId);
  // Reachable without the drag (ticket 113) — validated at the door.
  if (!isIsoDate(startDate) || !isIsoDate(endDate)) return;
  if (endDate < startDate) return;

  const days = await listDays(access.trip.id);
  const targets = days.filter((d) => d.date >= startDate && d.date <= endDate);
  if (targets.length === 0) return;

  const placeId =
    place === null ? null : await resolveOvernightPlace(access.trip.id, days, place);
  // Failing to resolve isn't a clear — refuse rather than clear the span.
  if (place !== null && placeId === null) return;

  await setOvernightPlaceOn(
    access.trip.id,
    targets.map((d) => d.id),
    placeId,
  );

  revalidateItinerary(access.trip.id);
}

/**
 * The place id a span should point at. Extending sends the existing id rather
 * than re-geocoding the name, which would mint a second, coordinate-less row.
 * A client-supplied id only counts if this trip's own days already use it —
 * otherwise it's a way to read another group's place row by number (rule 5).
 */
async function resolveOvernightPlace(
  tripId: number,
  days: ItineraryDay[],
  place: OvernightPlaceInput,
): Promise<number | null> {
  if ("placeId" in place) {
    return days.some((d) => d.overnightPlaceId === place.placeId) ? place.placeId : null;
  }
  const name = capText(place.name, "placeName");
  if (!name) return null;

  // A name typed while the provider was down (rule 11) has no id to dedupe
  // on, so check the trip's own places first to avoid minting a duplicate.
  if (!place.providerId) {
    const known = (await listOvernightPlaces(tripId)).find(
      (p) => p.name.toLowerCase() === name.toLowerCase(),
    );
    if (known) return known.id;
  }

  return upsertPlace({
    providerId: place.providerId ?? null,
    name,
    lat: place.lat ?? null,
    lng: place.lng ?? null,
    countryCode: place.countryCode ?? null,
  });
}

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

  revalidateItinerary(access.trip.id);
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

  revalidateItinerary(access.trip.id);
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

  revalidateItinerary(access.trip.id);
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
