"use server";

import { DAY_EVENT_TYPES, TRANSPORT_TYPES, type DayEventType, type TransportType } from "@/db/schema";
import { requireTripAccess } from "@/server/access";
import { withEventMoves } from "@/server/itinerary/event-log";
import { removeEvent, saveEvent } from "@/server/itinerary/event-save";
import { applyOvernight, type OvernightPlaceInput } from "@/server/itinerary/overnight";
import { insertAt, permuteEventSlots } from "@floc/core/itinerary/event-order";
import {
  applyEventSlots,
  extendTripDays,
  listDayIds,
  listEventSlots,
  moveEventToDay,
  rescheduleEvent as moveEventTo,
  type EventFields,
} from "@/server/itinerary/itinerary";
import { removeTripDay } from "@/server/itinerary/removal/remove-day";
import { refresh } from "@/server/freshness";
import { resetCalendarFeed } from "@/server/itinerary/feed/calendar-feed-link";
import { editTrip } from "@/server/trip-edit";

export async function addDays(tripId: number, afterDate: string, count: number) {
  const access = await requireTripAccess(tripId);
  await extendTripDays(access.trip, afterDate, count, access.viewer.id);
}

export async function removeDay(tripId: number, dayId: number) {
  await editTrip(tripId, "itinerary", async (access) => {
    const target = await access.day(dayId);
    await removeTripDay(access.trip, target.id, access.viewer.id);
  });
}

export async function setDayOvernight(
  tripId: number,
  startDate: string,
  endDate: string,
  place: OvernightPlaceInput | null,
) {
  const access = await requireTripAccess(tripId);
  await applyOvernight(access.trip.id, startDate, endDate, place);
}

export async function addEvent(tripId: number, dayId: number, input: EventFields) {
  await editTrip(tripId, "itinerary", (access) => saveEvent(access, { dayId }, input));
}

export async function updateEvent(
  tripId: number,
  eventId: number,
  input: EventFields,
) {
  await editTrip(tripId, "itinerary", (access) => saveEvent(access, { eventId }, input));
}

export async function deleteEvent(tripId: number, eventId: number) {
  await editTrip(tripId, "itinerary", (access) => removeEvent(access, eventId));
}

export async function reorderEvents(
  tripId: number,
  dayId: number,
  newOrder: number[],
) {
  const access = await requireTripAccess(tripId);

  const slots = permuteEventSlots(await listEventSlots(access.trip.id, dayId), newOrder);
  await withEventMoves(access.viewer.id, slots.map((slot) => slot.id), () => applyEventSlots(slots));

  refresh({ kind: "itinerary", tripId: access.trip.id });
}

async function insertEventAt(
  tripId: number,
  toDayId: number,
  eventId: number,
  fromDayId: number,
  index: number,
) {
  const access = await requireTripAccess(tripId);

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

  await withEventMoves(access.viewer.id, [eventId], () =>
    moveEventToDay(eventId, toDayId, {
      target,
      source: source.filter((e) => e.id !== eventId).map((e) => e.id),
    }),
  );

  refresh({ kind: "itinerary", tripId: access.trip.id });
}

export async function moveEventToAnotherDay(
  tripId: number,
  eventId: number,
  fromDayId: number,
  toDayId: number,
) {
  await insertEventAt(tripId, toDayId, eventId, fromDayId, Number.MAX_SAFE_INTEGER);
}

export async function rescheduleEvent(
  tripId: number,
  eventId: number,
  toDayId: number,
  time: string,
  endTime: string | null,
) {
  await editTrip(tripId, "itinerary", async (access) => {
    const target = await access.event(eventId);
    const toDay = await access.day(toDayId);

    const start = readClockTime(time);
    if (!start) return;

    await withEventMoves(access.viewer.id, [target.id], () => moveEventTo(target.id, toDay.id, start, readClockTime(endTime)));

    refresh({ kind: "itinerary", tripId: access.trip.id });
  });
}

function readClockTime(value: string | null): string | null {
  if (!value) return null;
  const m = /^(\d{2}):(\d{2})$/.exec(value);
  if (!m) return null;
  const [h, min] = [Number(m[1]), Number(m[2])];
  if (h > 24 || min > 59 || (h === 24 && min !== 0)) return null;
  return value;
}

export async function submitEvent(tripId: number, formData: FormData) {
  const dayId = Number(formData.get("dayId"));
  if (!Number.isInteger(dayId)) return;
  const rawEventId = String(formData.get("eventId") ?? "");
  const eventId = rawEventId ? Number(rawEventId) : null;
  if (eventId !== null && !Number.isInteger(eventId)) return;

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  await editTrip(tripId, "itinerary", (access) =>
    saveEvent(access, eventId ? { eventId } : { dayId }, { ...readEventFields(formData), title }, placeFrom(formData)));
}

function readEventFields(formData: FormData) {
  const rawType = String(formData.get("type") ?? "activity");
  const rawTransport = String(formData.get("transportType") ?? "");
  return {
    type: DAY_EVENT_TYPES.includes(rawType as DayEventType) ? (rawType as DayEventType) : "activity",
    transportType: TRANSPORT_TYPES.includes(rawTransport as TransportType)
      ? (rawTransport as TransportType)
      : null,
    time: readClockTime(String(formData.get("time") ?? "")),
    endTime: readClockTime(String(formData.get("endTime") ?? "")),
    allDay: formData.get("allDay") === "on",
    note: String(formData.get("note") ?? "") || null,
  };
}

function placeFrom(formData: FormData) {
  const name = String(formData.get("placeName") ?? "");
  if (!name.trim()) return null;
  const lat = formData.get("placeLat");
  const lng = formData.get("placeLng");
  return {
    providerId: String(formData.get("placeProviderId") ?? "") || null,
    name,
    lat: lat ? Number(lat) : null,
    lng: lng ? Number(lng) : null,
    countryCode: String(formData.get("placeCountryCode") ?? "") || null,
  };
}

export async function resetCalendarLink(tripId: number): Promise<string | null> {
  const access = await requireTripAccess(tripId);
  return resetCalendarFeed(access.trip.id, access.viewer.id);
}
