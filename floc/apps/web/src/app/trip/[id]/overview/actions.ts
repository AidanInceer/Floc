"use server";

import { redirect } from "next/navigation";

import { assertAdmin, requireTripAccess } from "@/server/access";
import { readNudgeTask, type NudgeResult } from "@floc/core/trip/nudge/nudge";
import { refreshNudged, sendNudges } from "@/server/trips/nudges";
import { capText } from "@floc/core/text/text";
import { readTripName } from "@floc/core/trip/trip-name";
import { castIdeaVote, deleteIdea, saveIdea } from "@/server/ideas/ideas";
import { addIdeaToDays, renameIdea, restoreIdea, takeIdeaOffDays } from "@/server/ideas/idea-writes";
import { readIdeaCategory } from "@floc/core/trip/idea-categories";
import { LIMITS } from "@/server/limits";
import { inviteToTrip } from "@/server/trips/invites";
import {
  leaveTripAs,
  promoteToAdmin,
  removeMembership,
} from "@/server/trips/roster";
import { saveTrip } from "@/server/trips/trip-save";
import { resetInviteToken } from "@/server/trips/trips";
import { refresh } from "@/server/freshness";

export async function nudge(tripId: number, task: string, toUserIds: string[]): Promise<NudgeResult> {
  const known = readNudgeTask(task);
  if (!known) throw new Error("Unknown nudge");
  const ids = [...new Set(toUserIds.map(String).filter((v) => v.length > 0 && v.length <= 64))].slice(0, LIMITS.members);

  const access = await requireTripAccess(tripId);
  const plan = await sendNudges(access, known, ids);
  if (plan.send.length > 0) refreshNudged(access.trip.id);
  return { sent: plan.send.length, capped: plan.capped };
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

export async function kickMember(formData: FormData) {
  const tripId = Number(formData.get("tripId"));
  const userId = String(formData.get("userId"));

  const access = await requireTripAccess(tripId);
  assertAdmin(access);

  await removeMembership(access.trip.id, userId, access.viewer.id);
}

export async function promoteMember(formData: FormData) {
  const tripId = Number(formData.get("tripId"));
  const userId = String(formData.get("userId"));

  const access = await requireTripAccess(tripId);
  assertAdmin(access);

  await promoteToAdmin(access.trip.id, userId);
}

export async function resetInviteLink(formData: FormData) {
  const tripId = Number(formData.get("tripId"));

  const access = await requireTripAccess(tripId);
  assertAdmin(access);

  await resetInviteToken(access.trip.id);
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

  redirect("/trips");
}

export async function addIdea(formData: FormData) {
  const tripId = Number(formData.get("tripId"));
  const title = capText(formData.get("title"), "ideaTitle");

  if (!title) return { error: "An idea needs a line of text." };

  const access = await requireTripAccess(tripId);

  await saveIdea(access.trip.id, access.viewer.id, title, readIdeaCategory(formData.get("category")));
}

export async function renameIdeaTitle(tripId: number, ideaId: number, title: string) {
  const name = capText(title, "ideaTitle");
  if (!name) return { error: "An idea needs a line of text." };
  await renameIdea(await requireTripAccess(tripId), Number(ideaId), name);
}

export async function undoRemoveIdea(tripId: number, ideaId: number) {
  await restoreIdea(await requireTripAccess(tripId), Number(ideaId));
}

export async function putIdeaOnDays(tripId: number, ideaId: number, dayId: number, time: string | null) {
  await addIdeaToDays(await requireTripAccess(tripId), Number(ideaId), Number(dayId), time ? String(time) : null);
}

export async function undoIdeaOnDays(tripId: number, ideaId: number) {
  await takeIdeaOffDays(await requireTripAccess(tripId), Number(ideaId));
}

export async function voteIdea(formData: FormData) {
  const tripId = Number(formData.get("tripId"));
  const ideaId = Number(formData.get("ideaId"));

  const access = await requireTripAccess(tripId);
  await castIdeaVote(access.trip.id, access.viewer.id, ideaId);
}

export async function removeIdea(formData: FormData) {
  const tripId = Number(formData.get("tripId"));
  const ideaId = Number(formData.get("ideaId"));

  const access = await requireTripAccess(tripId);
  await deleteIdea(access.trip.id, ideaId);
}
