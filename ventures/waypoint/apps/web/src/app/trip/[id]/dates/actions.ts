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
 */
import { revalidatePath } from "next/cache";

import { requireTripAccess } from "@/server/access";
import {
  clearAvailabilityFor,
  revalidateOverview,
  revalidateTripHeader,
  setAvailability,
  setTripDateRange,
} from "@/server/membership";

/** Cheap sanity check — these come from a client component's local state. */
function assertIsoDates(dates: string[]) {
  for (const d of dates) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) throw new Error(`Not a date: ${d}`);
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

  await setAvailability(tripId, access.viewer.id, dates, isAvailable);

  revalidateDates(tripId);
  revalidateOverview(tripId);
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
 */
export async function setTripDatesFromCalendar(formData: FormData) {
  const tripId = Number(formData.get("tripId"));
  const startDate = String(formData.get("startDate") ?? "").trim() || null;
  const endDate = String(formData.get("endDate") ?? "").trim() || null;

  if (!startDate || !endDate) return { error: "Pick both a start and an end." };
  if (startDate > endDate) {
    return { error: "The end date is before the start date." };
  }

  await requireTripAccess(tripId);
  await setTripDateRange(tripId, startDate, endDate);

  revalidateTripHeader(tripId);
}

/** Back to undated — the trip stays entirely usable without dates. */
export async function clearTripDates(tripId: number) {
  await requireTripAccess(tripId);
  await setTripDateRange(tripId, null, null);

  revalidateTripHeader(tripId);
}

/**
 * Drops the viewer's own marks. Used by "Start again" — clearing is a
 * per-person action, never a way to wipe what the rest of the group said.
 */
export async function clearMyAvailability(tripId: number) {
  const access = await requireTripAccess(tripId);
  await clearAvailabilityFor(tripId, access.viewer.id);

  revalidateDates(tripId);
}

/** The grid itself. Kept local: no other tab renders it. */
function revalidateDates(tripId: number) {
  revalidatePath(`/trip/${tripId}/dates`);
}
