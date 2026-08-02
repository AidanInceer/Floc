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

/**
 * The trip's whole lifecycle lives in this file (ticket 117) — archive,
 * restore, delete — even though two of the three are reached from Trip
 * settings on Overview rather than from a trip list.
 *
 * They used to exist twice: `archiveTrip`/`deleteTrip` here, wired to nothing,
 * and `archiveTripFromOverview`/`deleteTripFromOverview` with identical bodies
 * and a different `redirect`. Two exported Server Actions doing one job is two
 * surfaces to keep admin-gated, and the copy that nothing called was the one
 * that drifted. Where to land afterwards is the only thing that ever differed,
 * so it is a form field.
 */
function redirectTo(formData: FormData, fallback: string): string {
  const raw = String(formData.get("redirectTo") ?? "");
  // Site-relative only: this comes off a form, and a form is reachable without
  // the page around it (ticket 113). An off-site value is ignored, not obeyed.
  return raw.startsWith("/") && !raw.startsWith("//") ? raw : fallback;
}

/** Admin-only (ticket 01 step 7). Archived trips stay visible to every member. */
export async function archiveTrip(formData: FormData): Promise<void> {
  const tripId = Number(formData.get("tripId"));
  const access = await requireTripAccess(tripId);
  assertAdmin(access);

  await setTripArchived(access.trip.id, true);

  revalidateTripLists();
  revalidateOverview(access.trip.id);
  redirect(redirectTo(formData, "/trips/archived"));
}

/**
 * Admin-only. There is no member-facing "request restore" flow in v1
 * (ticket 17) — a member who wants a trip back just asks an admin, which
 * /trips/archived surfaces by naming them.
 */
export async function restoreTrip(tripId: number): Promise<void> {
  const access = await requireTripAccess(tripId);
  assertAdmin(access);

  await setTripArchived(access.trip.id, false);

  revalidateTripLists();
  revalidateOverview(access.trip.id);
}

/** Admin-only, any stage, no undo — soft-delete per ticket 04's convention. */
export async function deleteTrip(formData: FormData): Promise<void> {
  const tripId = Number(formData.get("tripId"));
  const access = await requireTripAccess(tripId);
  assertAdmin(access);

  await softDeleteTrip(access.trip.id);

  revalidateTripLists();
  redirect(redirectTo(formData, "/trips"));
}
