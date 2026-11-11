"use server";

// Mutations for /trips and /trips/archived. Trip-scoped calls go through
// requireTripAccess + assertAdmin — never a hand-rolled membership check.
import { redirect } from "next/navigation";

import { readOptionalIsoDate } from "@floc/core/dates/dates";
import { localPath } from "@floc/core/text/local-path";
import { renameTrip as validateAndRenameTrip } from "@/app/trip/[id]/overview/actions";
import { assertAdmin, requireTripAccess, requireUser } from "@/server/access";
import { acceptInvite, declineInvite } from "@/server/trips/invites";
import { saveTrip, startTrip } from "@/server/trips/trip-save";
import {
  setTripArchived,
  setTripMuted,
  setTripStarred,
  softDeleteTrip,
} from "@/server/trips/trips";
import { GROUP_CAP, TRIP_INVITE_CAP } from "@floc/core/people/group-ticks";
import { refresh } from "@/server/freshness";

// Smallest thing at creation: a name and the creator as admin. Dates are
// optional and never guessed at.
export async function createTrip(formData: FormData): Promise<void> {
  const viewer = await requireUser("/trips");

  // Empty is fine (rule 9), but unparseable is not — creating the trip
  // undated would quietly discard what was typed.
  const startDate = readOptionalIsoDate(formData.get("startDate"));
  const endDate = readOptionalIsoDate(formData.get("endDate"));
  if (startDate === undefined || endDate === undefined) {
    throw new Error("Those dates aren't days");
  }

  const tripId = await startTrip(viewer.id, {
    name: formData.get("name"), startDate, endDate, friendIds: readFriendIds(formData),
    groupIds: [...new Set(formData.getAll("groupIds").map(Number))].filter((id) => Number.isSafeInteger(id) && id > 0).slice(0, GROUP_CAP),
  });

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
  ].slice(0, TRIP_INVITE_CAP);
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
// and tags (rule 6) — not one of the admin powers. An unknown value clears
// it back to the id-rotation default rather than throwing (rule 11).
export async function setTripColor(formData: FormData): Promise<void> {
  await saveTrip(await requireTripAccess(Number(formData.get("tripId"))), { colorKey: String(formData.get("color") ?? "") });
}

// The trip's mark (#318). Cosmetic, so open to any member like the colour it
// sits beside. An unknown value clears it, leaving the pastel alone (rule 11).
export async function setTripMark(formData: FormData): Promise<void> {
  await saveTrip(await requireTripAccess(Number(formData.get("tripId"))), { mark: String(formData.get("mark") ?? "") });
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
