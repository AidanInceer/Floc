"use server";

/**
 * Mutations for /trips and /trips/archived (ticket 17).
 * Everything trip-scoped goes through requireTripAccess + assertAdmin —
 * never a hand-rolled membership check (see src/server/access.ts). The writes
 * are `server/membership.ts`'s (ticket 108).
 */
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { readOptionalIsoDate } from "@/lib/dates";
import { capRequiredText } from "@/lib/text";
import { assertAdmin, requireTripAccess, requireUser } from "@/server/access";
import {
  createTripWithAdmin,
  revalidateOverview,
  revalidateTripLists,
  setTripArchived,
  softDeleteTrip,
} from "@/server/membership";
import { ensureProfile } from "@/server/profile";

/**
 * Ticket 01 step 1: the smallest thing that exists at creation is a name,
 * the creator as admin, and an empty idea board — nothing else. Dates are
 * optional and guessed at by nobody.
 */
export async function createTrip(formData: FormData): Promise<void> {
  const viewer = await requireUser("/trips");
  const name = capRequiredText(formData.get("name"), "tripName");
  if (!name) throw new Error("A trip needs a name");

  // A trip may have no dates at all (rule 9), so an empty box is fine — but a
  // box with something unparseable in it is not, and creating the trip undated
  // would quietly discard what was typed (ticket 113).
  const startDate = readOptionalIsoDate(formData.get("startDate"));
  const endDate = readOptionalIsoDate(formData.get("endDate"));
  if (startDate === undefined || endDate === undefined) {
    throw new Error("Those dates aren't days");
  }

  await ensureProfile(viewer.id);

  const tripId = await createTripWithAdmin({
    name,
    startDate,
    endDate,
    createdBy: viewer.id,
  });

  revalidatePath("/trips");
  redirect(`/trip/${tripId}/overview`);
}

/** Admin-only (ticket 01 step 7). Archived trips stay visible to every member. */
export async function archiveTrip(tripId: number): Promise<void> {
  const access = await requireTripAccess(tripId);
  assertAdmin(access);

  await setTripArchived(tripId, true);

  revalidateTripLists();
  revalidateOverview(tripId);
}

/**
 * Admin-only. There is no member-facing "request restore" flow in v1
 * (ticket 17) — a member who wants a trip back just asks an admin, which
 * /trips/archived surfaces by naming them.
 */
export async function restoreTrip(tripId: number): Promise<void> {
  const access = await requireTripAccess(tripId);
  assertAdmin(access);

  await setTripArchived(tripId, false);

  revalidateTripLists();
  revalidateOverview(tripId);
}

/** Admin-only, any stage, no undo — soft-delete per ticket 04's convention. */
export async function deleteTrip(tripId: number): Promise<void> {
  const access = await requireTripAccess(tripId);
  assertAdmin(access);

  await softDeleteTrip(tripId);

  revalidateTripLists();
  redirect("/trips");
}
