"use server";

import { redirect } from "next/navigation";

import { NUDGE_TABS, type NudgeTab } from "@/db/schema";
import { assertAdmin, requireTripAccess, requireUser } from "@/server/access";
import { markTourSeen as markTourSeenFor } from "@/server/auth/tour";
import { capText } from "@floc/core/text/text";
import { readTripName } from "@floc/core/trip/trip-name";
import {
  findIdea,
  insertIdea,
  softDeleteIdea,
  toggleIdeaVote,
} from "@/server/ideas/ideas";
import { LIMITS } from "@/server/limits";
import { inviteToTrip } from "@/server/trips/invites";
import {
  insertNudge,
  leaveTripAs,
  removeMembership,
  setMemberRoleAdmin,
} from "@/server/trips/roster";
import { saveTrip } from "@/server/trips/trip-save";
import { resetInviteToken } from "@/server/trips/trips";
import { refresh } from "@/server/freshness";

export async function sendNudge(formData: FormData) {
  const tripId = Number(formData.get("tripId"));
  const toUserId = String(formData.get("toUserId"));
  const posted = String(formData.get("tab"));
  const tab = (NUDGE_TABS as readonly string[]).includes(posted)
    ? (posted as NudgeTab)
    : NUDGE_TABS[0];
  const message = capText(formData.get("message"), "nudgeMessage");

  const access = await requireTripAccess(tripId);
  if (!access.members.some((m) => m.userId === toUserId)) {
    throw new Error("Not a member of this trip");
  }

  await insertNudge({
    tripId: access.trip.id,
    fromUserId: access.viewer.id,
    toUserId,
    tab,
    message,
  });

  refresh({ kind: "tripOverview", tripId: access.trip.id });
}

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

  await removeMembership(access.trip.id, userId, access.viewer.id);

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

export async function resetInviteLink(formData: FormData) {
  const tripId = Number(formData.get("tripId"));

  const access = await requireTripAccess(tripId);
  assertAdmin(access);

  await resetInviteToken(access.trip.id);

  refresh({ kind: "tripOverview", tripId: access.trip.id });
}

export async function renameTrip(formData: FormData) {
  const read = readTripName(formData.get("name"));
  if ("problem" in read) return { error: read.problem };

  await saveTrip(await requireTripAccess(Number(formData.get("tripId"))), { name: read.name });
}

export async function setTripTags(formData: FormData) {
  await saveTrip(await requireTripAccess(Number(formData.get("tripId"))), { tags: formData.getAll("tag").map(String) });
}

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

export async function addIdea(formData: FormData) {
  const tripId = Number(formData.get("tripId"));
  const title = capText(formData.get("title"), "ideaTitle");

  if (!title) return { error: "An idea needs a line of text." };

  const access = await requireTripAccess(tripId);

  await insertIdea({
    tripId: access.trip.id,
    createdBy: access.viewer.id,
    title,
  });

  refresh({ kind: "ideas", tripId: access.trip.id });
}

export async function voteIdea(formData: FormData) {
  const tripId = Number(formData.get("tripId"));
  const ideaId = Number(formData.get("ideaId"));

  const access = await requireTripAccess(tripId);
  const target = await findIdea(access.trip.id, ideaId);
  if (!target) return;

  await toggleIdeaVote(target.id, access.viewer.id);

  refresh({ kind: "ideas", tripId: access.trip.id });
}

export async function removeIdea(formData: FormData) {
  const tripId = Number(formData.get("tripId"));
  const ideaId = Number(formData.get("ideaId"));

  const access = await requireTripAccess(tripId);
  const target = await findIdea(access.trip.id, ideaId);
  if (!target) return;

  await softDeleteIdea(access.trip.id, target.id);

  refresh({ kind: "ideas", tripId: access.trip.id });
}
