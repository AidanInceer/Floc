"use server";

/**
 * Dates tab mutations — availability, and turning it into the trip's dates.
 *
 * Every write here is open to any member: choosing when to go is not one of
 * admin's four powers (non-negotiable 6), and requiring an admin to press the
 * button would just stall the decision the tab exists to unstick.
 */
import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { availability, trip } from "@/db/schema";
import { requireTripAccess } from "@/lib/access";
import { touch } from "@/lib/unlocks";

/** Cheap sanity check — these come from a client component's local state. */
function assertIsoDates(dates: string[]) {
  for (const d of dates) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) throw new Error(`Not a date: ${d}`);
  }
}

/**
 * Marks the viewer free (or not) on a batch of dates in one statement.
 *
 * Unmarking writes `available: false` rather than soft-deleting the row: the
 * unique index is on (trip, user, date) and ignores `deleted_at`, so a
 * soft-deleted row would block the person from ever marking that day again.
 * The tally treats `false` and "no row" the same, so nothing downstream cares.
 */
export async function setAvailabilityDates(
  tripId: number,
  dates: string[],
  isAvailable: boolean,
) {
  if (dates.length === 0) return;
  assertIsoDates(dates);
  const access = await requireTripAccess(tripId);

  await db
    .insert(availability)
    .values(
      dates.map((date) => ({
        tripId,
        userId: access.viewer.id,
        date,
        available: isAvailable,
      })),
    )
    .onConflictDoUpdate({
      target: [availability.tripId, availability.userId, availability.date],
      set: { available: isAvailable, deletedAt: null, ...touch() },
    });

  revalidatePath(`/trip/${tripId}/dates`);
  revalidatePath(`/trip/${tripId}/overview`);
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
  await db
    .update(trip)
    .set({ startDate, endDate, ...touch() })
    .where(eq(trip.id, tripId));

  revalidatePath(`/trip/${tripId}`, "layout");
}

/** Back to undated — the trip stays entirely usable without dates. */
export async function clearTripDates(tripId: number) {
  await requireTripAccess(tripId);
  await db
    .update(trip)
    .set({ startDate: null, endDate: null, ...touch() })
    .where(eq(trip.id, tripId));

  revalidatePath(`/trip/${tripId}`, "layout");
}

/**
 * Drops the viewer's own marks. Used by "Start again" — clearing is a
 * per-person action, never a way to wipe what the rest of the group said.
 */
export async function clearMyAvailability(tripId: number) {
  const access = await requireTripAccess(tripId);
  await db
    .update(availability)
    .set({ available: false, ...touch() })
    .where(
      and(
        eq(availability.tripId, tripId),
        eq(availability.userId, access.viewer.id),
        isNull(availability.deletedAt),
      ),
    );

  revalidatePath(`/trip/${tripId}/dates`);
}
