"use server";

// Mutations for /trips and /trips/archived. Trip-scoped calls go through
// requireTripAccess + assertAdmin — never a hand-rolled membership check.
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { readOptionalIsoDate } from "@/lib/dates";
import { capRequiredText } from "@/lib/text";
import { isTripColor } from "@/lib/trip-color";
import { renameTrip as validateAndRenameTrip } from "@/app/trip/[id]/overview/actions";
import { assertAdmin, requireTripAccess, requireUser } from "@/server/access";
import {
  createTripWithAdmin,
  findPendingInvite,
  inviteToTrip,
  joinByToken,
  revalidateInvites,
  revalidateOverview,
  revalidateTripHeader,
  revalidateTripLists,
  setTripArchived,
  setTripColor as writeTripColor,
  settleInvite,
  softDeleteTrip,
} from "@/server/membership";
import { ensureProfile } from "@/server/profile";
import { LIMITS } from "@/server/limits";

// Smallest thing at creation: a name, the creator as admin, an empty idea
// board. Dates are optional and never guessed at.
export async function createTrip(formData: FormData): Promise<void> {
  const viewer = await requireUser("/trips");
  const name = capRequiredText(formData.get("name"), "tripName");
  if (!name) throw new Error("A trip needs a name");

  // Empty is fine (rule 9), but unparseable is not — creating the trip
  // undated would quietly discard what was typed.
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

  // Optional; `inviteToTrip` decides who's really invitable — this only
  // passes on what was ticked.
  const friendIds = readFriendIds(formData);
  if (friendIds.length > 0) {
    await inviteToTrip({ tripId, fromUserId: viewer.id, toUserIds: friendIds });
  }

  revalidatePath("/trips");
  redirect(`/trip/${tripId}/overview`);
}

// Ticked boxes, capped at the roster ceiling. Reads defensively — the form
// is reachable without the page around it, so don't assume the picker
// generated this.
function readFriendIds(formData: FormData): string[] {
  return [
    ...new Set(
      formData
        .getAll("friendIds")
        .map((v) => String(v))
        .filter((v) => v.length > 0 && v.length <= 64),
    ),
  ].slice(0, LIMITS.members);
}

// Accepting a named invite — the only other place besides the share link
// that writes a membership; same upsert since the invitee may have been
// kicked before. Gated on a live pending row, so a guessed trip id buys no
// membership (rule 5).
export async function acceptTripInvite(formData: FormData): Promise<void> {
  const tripId = Number(formData.get("tripId"));
  const viewer = await requireUser("/trips");
  if (!Number.isInteger(tripId)) return;

  const invite = await findPendingInvite(tripId, viewer.id);
  if (!invite) return;

  await joinByToken(tripId, viewer.id);
  await settleInvite(tripId, viewer.id, "accepted");
  await ensureProfile(viewer.id);

  revalidateInvites();
  revalidateTripLists();
  revalidateOverview(tripId);
  redirect(`/trip/${tripId}/overview`);
}

// Closes the invite, joins nothing — an admin may ask again.
export async function declineTripInvite(formData: FormData): Promise<void> {
  const tripId = Number(formData.get("tripId"));
  const viewer = await requireUser("/trips");
  if (!Number.isInteger(tripId)) return;

  await settleInvite(tripId, viewer.id, "declined");
  revalidateInvites();
}

// Where to land afterwards is a form field, not a second copy of these
// actions per caller — avoids two Server Actions doing one job.
function redirectTo(formData: FormData, fallback: string): string {
  const raw = String(formData.get("redirectTo") ?? "");
  // Site-relative only — an off-site value is ignored, not obeyed.
  return raw.startsWith("/") && !raw.startsWith("//") ? raw : fallback;
}

// The card menu renames from a plain form with no inline error surface, so it
// needs a void action. The name field is client-guarded (required + maxLength);
// a rejected name simply doesn't write. The Overview hero uses the
// error-returning `renameTrip` directly, through its inline editor.
export async function renameTripFromMenu(formData: FormData): Promise<void> {
  await validateAndRenameTrip(formData);
}

// The trip's pastel (ticket 213). Cosmetic, so open to any member like rename
// and tags (rule 6) — not one of the four admin powers. An unknown value clears
// it back to the id-rotation default rather than throwing (rule 11).
export async function setTripColor(formData: FormData): Promise<void> {
  const tripId = Number(formData.get("tripId"));
  const raw = String(formData.get("color") ?? "");
  const color = isTripColor(raw) ? raw : null;

  const access = await requireTripAccess(tripId);

  await writeTripColor(access.trip.id, color);

  revalidateTripLists();
  revalidateTripHeader(access.trip.id);
  revalidateOverview(access.trip.id);
}

// Admin-only. Archived trips stay visible to every member.
export async function archiveTrip(formData: FormData): Promise<void> {
  const tripId = Number(formData.get("tripId"));
  const access = await requireTripAccess(tripId);
  assertAdmin(access);

  await setTripArchived(access.trip.id, true);

  revalidateTripLists();
  revalidateOverview(access.trip.id);
  redirect(redirectTo(formData, "/trips/archived"));
}

// Admin-only. No member-facing "request restore" flow — a member asks an
// admin, whom /trips/archived surfaces by name.
export async function restoreTrip(tripId: number): Promise<void> {
  const access = await requireTripAccess(tripId);
  assertAdmin(access);

  await setTripArchived(access.trip.id, false);

  revalidateTripLists();
  revalidateOverview(access.trip.id);
}

// Admin-only, any stage, no undo — soft-delete.
export async function deleteTrip(formData: FormData): Promise<void> {
  const tripId = Number(formData.get("tripId"));
  const access = await requireTripAccess(tripId);
  assertAdmin(access);

  await softDeleteTrip(access.trip.id);

  revalidateTripLists();
  redirect(redirectTo(formData, "/trips"));
}
