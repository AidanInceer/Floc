"use server";

/**
 * Friend request lifecycle (ticket 18). Writes live in `server/social/friends.ts`
 * (ticket 108); this file decides who may open a request and what the other
 * person is told.
 */
import type { FriendSearch } from "@floc/api/port";

import { requireUser } from "@/server/access";
import {
  acceptPendingRequest,
  dropFriendship,
  dropPendingRequest,
  findUserById,
  friendshipBetween,
  openPendingRequest,
} from "@/server/social/friends";
import { mayAskToBeFriends } from "@/server/social/find-friends";
import { requestByCode } from "@/server/social/friend-code";
import { searchFriends } from "@/server/social/friend-search";
import { refresh } from "@/server/freshness";

/**
 * Opens a request by id (ticket 96). The id is never trusted alone: the
 * target must be inside one of your rings or a public friend of a friend, or
 * this becomes "is this a real account?" for any posted id (ticket 46).
 */
export async function requestFriendById(formData: FormData): Promise<{ error?: string }> {
  const viewer = await requireUser();
  const targetId = String(formData.get("targetId") ?? "");
  if (!targetId || targetId === viewer.id) return {};

  if (!(await mayAskToBeFriends(viewer.id, targetId))) return {};

  const target = await findUserById(targetId);
  if (!target) return {};

  // Already friends, or a request already sitting one way — refuse quietly.
  if (await friendshipBetween(viewer.id, target.id)) return {};

  await openPendingRequest(viewer.id, target.id);

  refresh({ kind: "friendship", otherId: target.id });
  // Found on a friend's friends list (ticket 145): the button lives on their page.
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
  const found = await requestByCode(viewer.id, String(formData.get("code") ?? ""));
  if (found) refresh({ kind: "friendship", otherId: found.id });
}

export async function acceptFriend(formData: FormData): Promise<void> {
  const viewer = await requireUser();
  const requesterId = String(formData.get("requesterId") ?? "");

  await acceptPendingRequest(requesterId, viewer.id);

  refresh({ kind: "friendship", otherId: requesterId });
}

export async function declineFriend(formData: FormData): Promise<void> {
  const viewer = await requireUser();
  const requesterId = String(formData.get("requesterId") ?? "");

  await dropPendingRequest(requesterId, viewer.id);

  refresh({ kind: "friendship", otherId: requesterId });
}

export async function cancelRequest(formData: FormData): Promise<void> {
  const viewer = await requireUser();
  const targetId = String(formData.get("targetId") ?? "");

  // Same write as declining, from the other end of the pair.
  await dropPendingRequest(viewer.id, targetId);

  refresh({ kind: "friendship", otherId: targetId });
}

export async function removeFriend(formData: FormData): Promise<void> {
  const viewer = await requireUser();
  const otherId = String(formData.get("otherId") ?? "");

  await dropFriendship(viewer.id, otherId);

  refresh({ kind: "friendship", otherId });
}
