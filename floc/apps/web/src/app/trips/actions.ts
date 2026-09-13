"use server";

// Mutations for /trips and /trips/archived. Trip-scoped calls go through
// requireTripAccess + assertAdmin — never a hand-rolled membership check.
import { redirect } from "next/navigation";

import { readOptionalIsoDate } from "@floc/core/dates/dates";
import { localPath } from "@floc/core/text/local-path";
import { capRequiredText } from "@floc/core/text/text";
import { isTripColor } from "@floc/core/trip/trip-color";
import { renameTrip as validateAndRenameTrip } from "@/app/trip/[id]/overview/actions";
import { assertAdmin, requireTripAccess, requireUser } from "@/server/access";
import { acceptInvite, declineInvite, inviteToTrip } from "@/server/trips/invites";
import {
  createTripWithAdmin,
  setTripArchived,
  setTripMuted,
  setTripStarred,
  softDeleteTrip,
  updateTrip,
} from "@/server/trips/trips";
import { ensureProfile } from "@/server/auth/profile";
import { LIMITS } from "@/server/limits";
import { refresh } from "@/server/freshness";

// Smallest thing at creation: a name and the creator as admin. Dates are
// optional and never guessed at.
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

  refresh({ kind: "tripList" });
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

// Accepting a named invite. `acceptInvite` is gated on a live pending row, so
// a guessed trip id buys no membership (rule 5) — a false answer means there
// was nothing here to accept, and we stay put.
export async function acceptTripInvite(formData: FormData): Promise<void> {
  const tripId = Number(formData.get("tripId"));
  const viewer = await requireUser("/trips");
  if (!Number.isInteger(tripId)) return;

  if (!(await acceptInvite(tripId, viewer.id))) return;

  redirect(`/trip/${tripId}/overview`);
}

export async function declineTripInvite(formData: FormData): Promise<void> {
  const tripId = Number(formData.get("tripId"));
  const viewer = await requireUser("/trips");
  if (!Number.isInteger(tripId)) return;

  await declineInvite(tripId, viewer.id);
}

// Where to land afterwards is a form field, not a second copy of these
// actions per caller — avoids two Server Actions doing one job.
function redirectTo(formData: FormData, fallback: string): string {
  return localPath(formData.get("redirectTo"), fallback);
}

// The card menu renames from a plain form with no inline error surface, so it
// needs a void action. The name field is client-guarded (required + maxLength);
// a rejected name simply doesn't write. The Overview hero uses the
// error-returning `renameTrip` directly, through its inline editor.
export async function renameTripFromMenu(formData: FormData): Promise<void> {
  await validateAndRenameTrip(formData);
}

// The trip's pastel (ticket 213). Cosmetic, so open to any member like rename
// and tags (rule 6) — not one of the three admin powers. An unknown value clears
// it back to the id-rotation default rather than throwing (rule 11).
export async function setTripColor(formData: FormData): Promise<void> {
  const tripId = Number(formData.get("tripId"));
  const raw = String(formData.get("color") ?? "");
  const color = isTripColor(raw) ? raw : null;

  const access = await requireTripAccess(tripId);

  await updateTrip(access.trip.id, { colorKey: color });

  refresh(
    { kind: "tripList" },
    { kind: "tripHeader", tripId: access.trip.id },
    { kind: "tripOverview", tripId: access.trip.id },
  );
}

// Your own star. Any member, not an admin power (rule 6).
export async function starTrip(formData: FormData): Promise<void> {
  const tripId = Number(formData.get("tripId"));
  const starred = formData.get("starred") === "true";

  const access = await requireTripAccess(tripId);
  await setTripStarred(access.trip.id, access.viewer.id, starred);

  refresh({ kind: "tripList" });
}

// Your own mute (#346): no push or email from this trip. Any member.
export async function muteTrip(formData: FormData): Promise<void> {
  const tripId = Number(formData.get("tripId"));
  const muted = formData.get("muted") === "true";

  const access = await requireTripAccess(tripId);
  await setTripMuted(access.trip.id, access.viewer.id, muted);

  refresh({ kind: "tripList" });
}

// Admin-only. Archived trips stay visible to every member.
export async function archiveTrip(formData: FormData): Promise<void> {
  const tripId = Number(formData.get("tripId"));
  const access = await requireTripAccess(tripId);
  assertAdmin(access);

  await setTripArchived(access.trip.id, true);

  refresh(
    { kind: "tripList" },
    { kind: "tripOverview", tripId: access.trip.id },
  );
  redirect(redirectTo(formData, "/trips/archived"));
}

// Admin-only. No member-facing "request restore" flow — a member asks an
// admin, whom /trips/archived surfaces by name.
export async function restoreTrip(tripId: number): Promise<void> {
  const access = await requireTripAccess(tripId);
  assertAdmin(access);

  await setTripArchived(access.trip.id, false);

  refresh(
    { kind: "tripList" },
    { kind: "tripOverview", tripId: access.trip.id },
  );
}

// Admin-only, any stage, no undo — soft-delete.
export async function deleteTrip(formData: FormData): Promise<void> {
  const tripId = Number(formData.get("tripId"));
  const access = await requireTripAccess(tripId);
  assertAdmin(access);

  await softDeleteTrip(access.trip.id);

  refresh({ kind: "tripList" });
  redirect(redirectTo(formData, "/trips"));
}
