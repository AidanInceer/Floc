"use server";

// Open to any member, not just admin — choosing when to go isn't one of
// admin's four powers (rule 6). Committing a window also updates
// server/itinerary.ts since the window decides which days exist (ticket 140).
import { isIsoDate, readIsoDate } from "@floc/core/dates";
import { requireTripAccess } from "@/server/access";
import { applyTripWindow } from "@/server/itinerary";
import { clearAvailabilityFor, setAvailability } from "@/server/availability";
import { updateTrip } from "@/server/trips";
import { refresh } from "@/server/freshness";

// Client-provided, so checked not trusted; isIsoDate rejects impossible
// well-shaped dates like 2026-02-31 (ticket 113).
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

export async function saveAvailability(
  tripId: number,
  add: string[],
  remove: string[],
) {
  await setAvailabilityDates(tripId, add, true);
  await setAvailabilityDates(tripId, remove, false);
}

// Deliberately available before everyone has answered — someone has to just
// book it. Takes the pair as args rather than FormData (ticket 128): the
// window comes from calendar-picked client state, so it's checked not trusted.
export async function setTripDates(
  tripId: number,
  start: string | null,
  end: string | null,
) {
  const startDate = readIsoDate(start);
  const endDate = readIsoDate(end);

  if (!startDate || !endDate) throw new Error("Pick both a start and an end");
  // Safe as a string compare only because both are known YYYY-MM-DD by here.
  if (startDate > endDate) throw new Error("The end date is before the start");

  const access = await requireTripAccess(tripId);
  await updateTrip(access.trip.id, { startDate, endDate });
  // Window is the itinerary's extent (ticket 140): days in both windows keep
  // their events, days only in the old one go, days only in the new arrive blank.
  await applyTripWindow(access.trip.id, startDate, endDate);

  // The window is the itinerary's extent (ticket 140), so one fact carries
  // the dates tab, the header and the days it just added or dropped.
  refresh({ kind: "tripWindow", tripId: access.trip.id });
}

// Back to undated — supported (rule 9), not an error state. No window means
// no extent, so the itinerary goes with it (ticket 140); ideas/money/people stay.
export async function clearTripDates(tripId: number) {
  const access = await requireTripAccess(tripId);
  await updateTrip(access.trip.id, { startDate: null, endDate: null });
  await applyTripWindow(access.trip.id, null, null);

  // The window is the itinerary's extent (ticket 140), so one fact carries
  // the dates tab, the header and the days it just added or dropped.
  refresh({ kind: "tripWindow", tripId: access.trip.id });
}

// "Start again" — per-person only, never wipes what the rest of the group said.
export async function clearMyAvailability(tripId: number) {
  const access = await requireTripAccess(tripId);
  await clearAvailabilityFor(access.trip.id, access.viewer.id);

  refresh({ kind: "tripDates", tripId: access.trip.id });
}
