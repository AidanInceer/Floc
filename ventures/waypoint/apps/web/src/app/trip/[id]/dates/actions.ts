"use server";

/**
 * Dates tab mutations — availability, and turning it into the trip's dates.
 *
 * Every write here is open to any member: choosing when to go is not one of
 * admin's four powers (non-negotiable 6), and requiring an admin to press the
 * button would just stall the decision the tab exists to unstick.
 *
 * The SQL is `server/membership.ts`'s (ticket 108) — availability is a fact
 * about members, so it lives with the roster rather than in a module of its own.
 * Committing a window also reaches into `server/itinerary.ts`, because the
 * window decides which days exist (ticket 140) — two aggregates, one decision,
 * which is the action's job to make and neither aggregate's to know about.
 */
import { revalidatePath } from "next/cache";

import { isIsoDate, readIsoDate } from "@/lib/dates";
import { requireTripAccess } from "@/server/access";
import { applyTripWindow } from "@/server/itinerary";
import {
  clearAvailabilityFor,
  revalidateOverview,
  revalidateTripHeader,
  setAvailability,
  setTripDateRange,
} from "@/server/membership";

/**
 * These come from a client component's local state, so they are checked rather
 * than trusted. `isIsoDate` also rejects a well-shaped impossible day like
 * `2026-02-31`, which the old local regex here accepted (ticket 113).
 */
function assertIsoDates(dates: string[]) {
  for (const d of dates) {
    if (!isIsoDate(d)) throw new Error(`Not a date: ${d}`);
  }
}

/** Marks the viewer free (or not) on a batch of dates — see `setAvailability`. */
export async function setAvailabilityDates(
  tripId: number,
  dates: string[],
  isAvailable: boolean,
) {
  if (dates.length === 0) return;
  assertIsoDates(dates);
  const access = await requireTripAccess(tripId);

  await setAvailability(access.trip.id, access.viewer.id, dates, isAvailable);

  revalidateDates(access.trip.id);
  revalidateOverview(access.trip.id);
}

/** One round trip for a whole editing session's worth of changes. */
export async function saveAvailability(
  tripId: number,
  add: string[],
  remove: string[],
) {
  await setAvailabilityDates(tripId, add, true);
  await setAvailabilityDates(tripId, remove, false);
}

/**
 * Commits the group's dates. Deliberately available before everyone has
 * answered — the suggested window comes from whoever *has*, and someone
 * eventually has to just book it.
 *
 * Takes the pair as arguments rather than a `FormData` (ticket 128): the
 * window is picked on the calendar now, not typed into two boxes, so what
 * arrives is a client component's local state. Which means it is checked, not
 * trusted — `isIsoDate` also rejects a well-shaped impossible day.
 */
export async function setTripDates(
  tripId: number,
  start: string | null,
  end: string | null,
) {
  const startDate = readIsoDate(start);
  const endDate = readIsoDate(end);

  if (!startDate || !endDate) throw new Error("Pick both a start and an end");
  // Only safe as a string compare *because* both are known `YYYY-MM-DD` by
  // here — the old code did this on unvalidated input, where it meant nothing.
  if (startDate > endDate) throw new Error("The end date is before the start");

  const access = await requireTripAccess(tripId);
  await setTripDateRange(access.trip.id, startDate, endDate);
  // The window *is* the itinerary's extent (ticket 140), so the days follow it
  // in the same action: a date in both windows keeps its events, a date only in
  // the old one goes, a date only in the new one arrives blank. The calendar
  // has already named what that costs and been clicked a second time.
  await applyTripWindow(access.trip.id, startDate, endDate);

  revalidateTripHeader(access.trip.id);
  revalidateDates(access.trip.id);
}

/**
 * Back to undated — still a supported path (rule 9), and still not an error
 * state. But no window means no extent, so the itinerary goes with it
 * (ticket 140): the trip keeps its ideas, its money and its people, and the
 * plan starts again when the group picks a window. The menu item behind this
 * asks first, and names the days and events it is about to take.
 */
export async function clearTripDates(tripId: number) {
  const access = await requireTripAccess(tripId);
  await setTripDateRange(access.trip.id, null, null);
  await applyTripWindow(access.trip.id, null, null);

  revalidateTripHeader(access.trip.id);
  revalidateDates(access.trip.id);
}

/**
 * Drops the viewer's own marks. Used by "Start again" — clearing is a
 * per-person action, never a way to wipe what the rest of the group said.
 */
export async function clearMyAvailability(tripId: number) {
  const access = await requireTripAccess(tripId);
  await clearAvailabilityFor(access.trip.id, access.viewer.id);

  revalidateDates(access.trip.id);
}

/** The grid itself. Kept local: no other tab renders it. */
function revalidateDates(tripId: number) {
  revalidatePath(`/trip/${tripId}/dates`);
}
