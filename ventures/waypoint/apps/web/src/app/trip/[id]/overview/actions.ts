"use server";

// Overview tab's who-may-do-what (ticket 13); SQL lives in server/membership.ts
// (ticket 108). Admin powers stay invite/kick/delete/promote (ticket 01 step 7).
import { redirect } from "next/navigation";
import { after } from "next/server";

import { NUDGE_TABS, type NudgeTab } from "@/db/schema";
import { assertAdmin, requireTripAccess } from "@/server/access";
import { emails, sendEmails } from "@/server/email";
import { parseTagRows } from "@/lib/tags";
import { capText, TEXT_CAPS } from "@/lib/text";
import { LIMITS } from "@/server/limits";
import {
  insertNudge,
  inviteToTrip,
  leaveTripAs,
  revalidateInvites,
  removeMembership,
  renameTrip as writeTripName,
  revalidateOverview,
  revalidateProfileTrips,
  revalidateTripHeader,
  revalidateTripLists,
  setMemberRoleAdmin,
  setTripTagRows,
} from "@/server/membership";

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

  revalidateOverview(access.trip.id);
}

// Invite by name (ticket 146). Admin-gated like the share link (rule 6);
// in-app only, delivered on the invitee's next /trips load — no email/push.
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
  assertAdmin(access);

  if (friendIds.length === 0) return;

  await inviteToTrip({
    tripId: access.trip.id,
    fromUserId: access.viewer.id,
    toUserIds: friendIds,
  });

  revalidateOverview(access.trip.id);
  revalidateInvites();
}

export async function kickMember(formData: FormData) {
  const tripId = Number(formData.get("tripId"));
  const userId = String(formData.get("userId"));

  const access = await requireTripAccess(tripId);
  assertAdmin(access);

  await removeMembership(access.trip.id, userId);

  revalidateOverview(access.trip.id);
  revalidateProfileTrips();
}

export async function promoteMember(formData: FormData) {
  const tripId = Number(formData.get("tripId"));
  const userId = String(formData.get("userId"));

  const access = await requireTripAccess(tripId);
  assertAdmin(access);

  await setMemberRoleAdmin(access.trip.id, userId);

  revalidateOverview(access.trip.id);
}

// Open to any member deliberately — not one of the four admin powers (rule 6).
export async function renameTrip(formData: FormData) {
  const tripId = Number(formData.get("tripId"));
  const name = String(formData.get("name") ?? "").trim();

  if (!name) return { error: "A trip needs a name." };
  // Rejected, not truncated — silent clipping would be visibly wrong (ticket 113).
  if (name.length > TEXT_CAPS.tripName) return { error: "That name is too long." };

  const access = await requireTripAccess(tripId);

  await writeTripName(access.trip.id, name);

  revalidateTripHeader(access.trip.id);
  revalidateTripLists();
}

// Trip tags (ticket 71), open to any member like renaming. `parseTagRows` owns
// normalisation/caps. Empty clears to `[]`, never a half-state. Colour rides
// along per row (ticket 86) — clearing a tag's name is how it's deleted.
export async function setTripTags(formData: FormData) {
  const tripId = Number(formData.get("tripId"));
  const names = formData.getAll("tag").map(String);
  const tones = formData.getAll("tone").map(String);
  const { tags, tagTones } = parseTagRows(
    names.map((name, i) => ({ name, tone: tones[i] ?? "" })),
  );

  const access = await requireTripAccess(tripId);

  await setTripTagRows(access.trip.id, tags, tagTones);

  revalidateOverview(access.trip.id);
  revalidateTripLists();
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

  revalidateTripLists();
  revalidateProfileTrips();
  redirect("/trips");
}

