"use server";

import { isIsoDate } from "@floc/core/dates/dates";
import { windowProblem } from "@floc/core/trip/trip-window";
import { requireTripAccess, requireUser } from "@/server/access";
import { setTripWindow } from "@/server/itinerary/itinerary";
import { isTripLength, type TripLength } from "@floc/core/dates/finding/trip-length";
import { clearAvailabilityFor, setAvailability, setPreferredDays } from "@/server/itinerary/availability";
import { setLengthChoice } from "@/server/itinerary/trip-length";
import { refresh } from "@/server/freshness";
import { removeGuest } from "@/server/guests/guests";
import { fillFromCalendar, type CalendarFill } from "@/server/calendar/calendar-import";
import { setCalendarAllDayOnly } from "@/server/calendar/calendar-options";

function assertIsoDates(dates: string[]) {
  for (const d of dates) {
    if (!isIsoDate(d)) throw new Error(`Not a date: ${d}`);
  }
}

async function setAvailabilityDates(
  tripId: number,
  dates: string[],
  isAvailable: boolean,
) {
  if (dates.length === 0) return;
  assertIsoDates(dates);
  const access = await requireTripAccess(tripId);

  await setAvailability(access.trip.id, access.viewer.id, dates, isAvailable);

  refresh(
    { kind: "tripDates", tripId: access.trip.id },
    { kind: "tripOverview", tripId: access.trip.id },
  );
}

async function setPreferredDates(tripId: number, dates: string[], preferred: boolean) {
  if (dates.length === 0) return;
  assertIsoDates(dates);
  const access = await requireTripAccess(tripId);

  await setPreferredDays(access.trip.id, access.viewer.id, dates, preferred);

  refresh({ kind: "tripDates", tripId: access.trip.id }, { kind: "tripOverview", tripId: access.trip.id });
}

export async function saveAvailability(
  tripId: number,
  add: string[],
  remove: string[],
  prefer: { on: string[]; off: string[] } = { on: [], off: [] },
) {
  await setAvailabilityDates(tripId, add, true);
  await setAvailabilityDates(tripId, remove, false);
  await setPreferredDates(tripId, prefer.on, true);
  await setPreferredDates(tripId, prefer.off, false);
}

export async function setTripLength(tripId: number, length: TripLength, picked: boolean) {
  if (!isTripLength(length)) throw new Error("Not a length.");
  if (typeof picked !== "boolean") throw new Error("Not a choice.");
  const access = await requireTripAccess(tripId);

  await setLengthChoice(access.trip.id, access.viewer.id, length, picked);

  refresh({ kind: "tripDates", tripId: access.trip.id });
}

export async function setTripDates(
  tripId: number,
  start: string | null,
  end: string | null,
): Promise<{ error?: string }> {
  const problem = start === null || end === null ? "Pick both a start and an end." : windowProblem(start, end);
  if (problem) return { error: problem };

  const access = await requireTripAccess(tripId);
  await setTripWindow(access.trip.id, start, end, access.viewer.id);
  return {};
}

export async function applyBestWindow(tripId: number, start: string, end: string): Promise<void> {
  await setTripDates(tripId, start, end);
}

export async function clearTripDates(tripId: number) {
  const access = await requireTripAccess(tripId);
  await setTripWindow(access.trip.id, null, null, access.viewer.id);
}

export async function clearMyAvailability(tripId: number) {
  const access = await requireTripAccess(tripId);
  await clearAvailabilityFor(access.trip.id, access.viewer.id);

  refresh({ kind: "tripDates", tripId: access.trip.id });
}

export async function removeTripGuest(tripId: number, guestId: string) {
  const access = await requireTripAccess(tripId);
  await removeGuest(access.trip.id, String(guestId));

  refresh({ kind: "tripDates", tripId: access.trip.id }, { kind: "tripOverview", tripId: access.trip.id });
}

export async function fillFromGoogleCalendar(tripId: number, month: string): Promise<CalendarFill> {
  const access = await requireTripAccess(tripId);
  const result = await fillFromCalendar({
    tripId: access.trip.id,
    userId: access.viewer.id,
    startDate: access.trip.startDate,
    endDate: access.trip.endDate,
    month,
  });
  if (result.status === "filled") {
    refresh({ kind: "tripDates", tripId: access.trip.id }, { kind: "tripOverview", tripId: access.trip.id });
  }
  return result;
}

export async function keepCalendarAllDayOnly(on: boolean): Promise<void> {
  if (typeof on !== "boolean") throw new Error("Not a choice.");
  const viewer = await requireUser();
  await setCalendarAllDayOnly(viewer.id, on);
}
