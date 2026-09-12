"use server";

// Overview tab's who-may-do-what (ticket 13); the SQL lives in server/roster.ts,
// server/invites.ts and server/trips.ts (ticket 242). Admin powers are
// kick/promote/delete (#312 took invite off the list).
import { redirect } from "next/navigation";
import { after } from "next/server";

import { NUDGE_TABS, type NudgeTab } from "@/db/schema";
import { assertAdmin, requireTripAccess, requireUser } from "@/server/access";
import { markTourSeen as markTourSeenFor } from "@/server/auth/tour";
import { emails, sendEmails } from "@/server/auth/email";
import { parseTagNames } from "@floc/core/trip/tags";
import { capText, TEXT_CAPS } from "@floc/core/text/text";
import { LIMITS } from "@/server/limits";
import { inviteToTrip } from "@/server/trips/invites";
import {
  insertNudge,
  leaveTripAs,
  removeMembership,
  setMemberRoleAdmin,
} from "@/server/trips/roster";
import { updateTrip } from "@/server/trips/trips";
import { refresh } from "@/server/freshness";

export async function sendNudge(formData: FormData) {
  const tripId = Number(formData.get("tripId"));
  const toUserId = String(formData.get("toUserId"));
  // Checked, not cast: a bad tab would deep-link a mail to a 404 (ticket 144).
  const posted = String(formData.get("tab"));
  const tab = (NUDGE_TABS as readonly string[]).includes(posted)
    ? (posted as NudgeTab)
    : NUDGE_TABS[0];
  const message = capText(formData.get("message"), "nudgeMessage");

  const access = await requireTripAccess(tripId);
  const recipient = access.members.find((m) => m.userId === toUserId);
  if (!recipient) throw new Error("Not a member of this trip");

  await insertNudge({
    tripId: access.trip.id,
    fromUserId: access.viewer.id,
    toUserId,
    tab,
    message,
  });

  // Mail rides out after the response, not blocking it (ticket 111).
  after(() =>
    sendEmails([
      emails.nudge({
        to: recipient.email,
        toUserId: recipient.userId,
        tripId: access.trip.id,
        tripName: access.trip.name,
        fromName: access.viewer.name,
        tab,
        message,
      }),
    ]),
  );

  refresh({ kind: "tripOverview", tripId: access.trip.id });
}

// Why: any member may invite (#312). In-app only, no mail (ticket 146).
export async function inviteFriends(formData: FormData) {
  const tripId = Number(formData.get("tripId"));
  const friendIds = [
    ...new Set(
      formData
        .getAll("friendIds")
        .map(String)
        .filter((v) => v.length > 0 && v.length <= 64),
    ),
  ].slice(0, LIMITS.members);

  const access = await requireTripAccess(tripId);

  if (friendIds.length === 0) return;

  await inviteToTrip({
    tripId: access.trip.id,
    fromUserId: access.viewer.id,
    toUserIds: friendIds,
  });

  refresh(
    { kind: "tripOverview", tripId: access.trip.id },
    { kind: "invites" },
  );
}

export async function markTourSeen() {
  const viewer = await requireUser();
  await markTourSeenFor(viewer.id);
}

export async function kickMember(formData: FormData) {
  const tripId = Number(formData.get("tripId"));
  const userId = String(formData.get("userId"));

  const access = await requireTripAccess(tripId);
  assertAdmin(access);

  await removeMembership(access.trip.id, userId);

  refresh(
    { kind: "tripOverview", tripId: access.trip.id },
    { kind: "profileTrips" },
  );
}

export async function promoteMember(formData: FormData) {
  const tripId = Number(formData.get("tripId"));
  const userId = String(formData.get("userId"));

  const access = await requireTripAccess(tripId);
  assertAdmin(access);

  await setMemberRoleAdmin(access.trip.id, userId);

  refresh({ kind: "tripOverview", tripId: access.trip.id });
}

// Open to any member deliberately — not one of the three admin powers (rule 6).
export async function renameTrip(formData: FormData) {
  const tripId = Number(formData.get("tripId"));
  const name = String(formData.get("name") ?? "").trim();

  if (!name) return { error: "A trip needs a name." };
  // Rejected, not truncated — silent clipping would be visibly wrong (ticket 113).
  if (name.length > TEXT_CAPS.tripName) return { error: "That name is too long." };

  const access = await requireTripAccess(tripId);

  await updateTrip(access.trip.id, { name });

  refresh(
    { kind: "tripHeader", tripId: access.trip.id },
    { kind: "tripList" },
  );
}

// Trip tags (ticket 71), open to any member like renaming. `parseTagNames` owns
// normalisation/caps. Empty clears to `[]`, never a half-state. Colour is the
// trip's, not the tag's (ticket 213) — clearing a tag's name is how it's deleted.
export async function setTripTags(formData: FormData) {
  const tripId = Number(formData.get("tripId"));
  const tags = parseTagNames(formData.getAll("tag").map(String));

  const access = await requireTripAccess(tripId);

  await updateTrip(access.trip.id, { tags });

  refresh(
    { kind: "tripOverview", tripId: access.trip.id },
    { kind: "tripList" },
  );
}

// Leaving (ticket 65), open to every member incl. admin. Two side effects
// decided here rather than a second dialog: last admin leaving passes admin to
// the earliest-joined remaining member (succession, not a fifth power — rule
// 6); last member out archives the trip (not a delete — rows survive).
export async function leaveTrip(formData: FormData) {
  const tripId = Number(formData.get("tripId"));

  const access = await requireTripAccess(tripId);

  await leaveTripAs({
    tripId: access.trip.id,
    userId: access.viewer.id,
    isAdmin: access.isAdmin,
    archivedAt: access.trip.archivedAt,
    others: access.members.filter((m) => m.userId !== access.viewer.id),
  });

  refresh(
    { kind: "tripList" },
    { kind: "profileTrips" },
  );
  redirect("/trips");
}

