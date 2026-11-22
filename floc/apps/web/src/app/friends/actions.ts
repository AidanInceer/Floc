"use server";

import type { FriendSearch } from "@floc/api/port";

import { requireUser } from "@/server/access";
import { acceptPendingRequest, cancelFriendRequest, declineFriendRequest, dropFriendship } from "@/server/social/friends";
import { requestFriend } from "@/server/social/find-friends";
import { requestByCode } from "@/server/social/friend-code";
import { searchFriends } from "@/server/social/friend-search";
import type { ListingRates } from "@floc/core/trip/explore/listing-price";
import { headers } from "next/headers";

import { createGroup, deleteGroup, saveGroup, setGroupMember, type GroupInput } from "@/server/social/groups";
import { groupIdeasFor, sendGroupIdeas, type GroupIdeas, type SentGroupIdeas } from "@/server/social/group-ideas";
import { savedTripIds } from "@/server/explore/explore-saves";
import { listingRates, viewerCurrency } from "@/server/money/viewer-currency";
import { refresh } from "@/server/freshness";
import { orRefusal } from "@floc/core/errors/refusal";

export async function requestFriendById(formData: FormData): Promise<{ error?: string }> {
  const viewer = await requireUser();
  const targetId = String(formData.get("targetId") ?? "");
  if (!(await requestFriend(viewer.id, targetId))) return {};

  const viaId = String(formData.get("viaId") ?? "");
  if (viaId) refresh({ kind: "friendship", otherId: viaId });
  return {};
}

export async function findFriends(query: string): Promise<FriendSearch> {
  const viewer = await requireUser();
  return searchFriends(viewer.id, query);
}

export async function requestFriendByCode(formData: FormData): Promise<void> {
  const viewer = await requireUser();
  await requestByCode(viewer.id, String(formData.get("code") ?? ""));
}

export async function acceptFriend(formData: FormData): Promise<void> {
  const viewer = await requireUser();
  const requesterId = String(formData.get("requesterId") ?? "");

  await acceptPendingRequest(requesterId, viewer.id);
}

export async function declineFriend(formData: FormData): Promise<void> {
  const viewer = await requireUser();
  const requesterId = String(formData.get("requesterId") ?? "");

  await declineFriendRequest(viewer.id, requesterId);
}

export async function cancelRequest(formData: FormData): Promise<void> {
  const viewer = await requireUser();
  const targetId = String(formData.get("targetId") ?? "");

  await cancelFriendRequest(viewer.id, targetId);
}

export async function removeFriend(formData: FormData): Promise<void> {
  const viewer = await requireUser();
  const otherId = String(formData.get("otherId") ?? "");

  await dropFriendship(viewer.id, otherId);
}

type Outcome = { error?: string; id?: number };

async function asGroupWrite(write: (viewerId: string) => Promise<number | void>): Promise<Outcome> {
  const viewer = await requireUser();
  return orRefusal(async () => {
    const id = await write(viewer.id);
    return typeof id === "number" ? { id } : {};
  });
}

export async function createGroupAction(input: GroupInput): Promise<Outcome> {
  return asGroupWrite((viewerId) => createGroup(viewerId, input));
}

export async function saveGroupAction(groupId: number, input: GroupInput): Promise<Outcome> {
  return asGroupWrite((viewerId) => saveGroup(viewerId, groupId, input));
}

export async function setGroupMemberAction(groupId: number, userId: string, on: boolean): Promise<Outcome> {
  return asGroupWrite((viewerId) => setGroupMember(viewerId, groupId, userId, on));
}

export async function deleteGroupAction(groupId: number): Promise<Outcome> {
  return asGroupWrite((viewerId) => deleteGroup(viewerId, groupId));
}

export type GroupIdeasFound = { ideas?: GroupIdeas; saved?: string[]; rates?: ListingRates | null; error?: string };

export async function groupIdeasAction(groupId: number): Promise<GroupIdeasFound> {
  const viewer = await requireUser();
  const [ideas, saved, rates] = await Promise.all([
    groupIdeasFor(viewer.id, groupId),
    savedTripIds(viewer.id),
    viewerCurrency(viewer.id, await headers()).then(listingRates),
  ]);
  return ideas ? { ideas, saved, rates } : { error: "That group is gone." };
}

export async function sendGroupIdeasAction(groupId: number): Promise<{ sent?: SentGroupIdeas; error?: string }> {
  const viewer = await requireUser();
  return orRefusal(async () => {
    const sent = await sendGroupIdeas(viewer.id, groupId);
    refresh({ kind: "wishLists" });
    refresh({ kind: "inbox" });
    return { sent };
  });
}
