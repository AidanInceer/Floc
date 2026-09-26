"use server";

// Open to any member, not just admin — choosing when to go isn't one of
// the admin powers (rule 6). Committing a window also updates
// server/itinerary/itinerary.ts since the window decides which days exist (ticket 140).
import { isIsoDate } from "@floc/core/dates/dates";
import { windowProblem } from "@floc/core/trip/trip-window";
import { requireTripAccess } from "@/server/access";
import { setTripWindow } from "@/server/itinerary/itinerary";
import { clearAvailabilityFor, setAvailability } from "@/server/itinerary/availability";
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
): Promise<{ error?: string }> {
  const problem = start === null || end === null ? "Pick both a start and an end." : windowProblem(start, end);
  if (problem) return { error: problem };

  const access = await requireTripAccess(tripId);
  // Window is the itinerary's extent (ticket 140): days in both windows keep
  // their events, days only in the old one go, days only in the new arrive blank.
  await setTripWindow(access.trip.id, start, end, access.viewer.id);
  return {};
}

// The best window is worked out from the group's own answers, so it is always a valid one.
export async function applyBestWindow(tripId: number, start: string, end: string): Promise<void> {
  await setTripDates(tripId, start, end);
}

// Back to undated — supported (rule 9), not an error state. No window means
// no extent, so the itinerary goes with it (ticket 140); notes/money/people stay.
export async function clearTripDates(tripId: number) {
  const access = await requireTripAccess(tripId);
  await setTripWindow(access.trip.id, null, null, access.viewer.id);
}

// "Start again" — per-person only, never wipes what the rest of the group said.
export async function clearMyAvailability(tripId: number) {
  const access = await requireTripAccess(tripId);
  await clearAvailabilityFor(access.trip.id, access.viewer.id);

  refresh({ kind: "tripDates", tripId: access.trip.id });
}
