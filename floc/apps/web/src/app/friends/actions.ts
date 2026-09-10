"use server";

/**
 * Friend request lifecycle (ticket 18). Writes live in `server/friends.ts`
 * (ticket 108); this file decides who may open a request and what the other
 * person is told.
 */
import { after } from "next/server";

import { requireUser } from "@/server/access";
import { emails, sendEmails } from "@/server/auth/email";
import {
  acceptPendingRequest,
  dropFriendship,
  dropPendingRequest,
  findUserById,
  friendOfFriend,
  friendshipBetween,
  openPendingRequest,
} from "@/server/social/friends";
import { canSeeFriendsOf, relationTo } from "@/server/auth/visibility";
import { refresh } from "@/server/freshness";

/**
 * The only way to open a request (ticket 96) — no add-by-email form. The id
 * is never trusted alone: `relationTo` re-checks the target is inside one of
 * your rings, or this becomes "is this a real account?" for any posted id
 * (the hole `/profile/<userId>` closed, ticket 46).
 */
export async function requestFriendById(formData: FormData): Promise<{ error?: string }> {
  const viewer = await requireUser();
  const targetId = String(formData.get("targetId") ?? "");
  if (!targetId || targetId === viewer.id) return {};

  // Second way in (ticket 145): someone met via a friend's friends list, in
  // none of your rings. `viaId` buys nothing alone — re-derived here, both
  // halves accepted friendships, and the middle person must have been
  // showing the list, else this becomes "post two ids, learn if they know each other".
  const viaId = String(formData.get("viaId") ?? "");
  const viaChain = viaId
    ? (await friendOfFriend(viewer.id, viaId, targetId)) &&
      (await canSeeFriendsOf(viaId, viewer.id))
    : false;

  const relation = await relationTo(viewer.id, targetId);
  if ((!relation || relation === "self") && !viaChain) return {};

  const target = await findUserById(targetId);
  if (!target) return {};

  // Already friends, or a request already sitting one way — refuse quietly.
  if (await friendshipBetween(viewer.id, target.id)) return {};

  await openPendingRequest(viewer.id, target.id);

  // Notifying is a side effect, runs after the response (ticket 111).
  after(() =>
    sendEmails([
      emails.friendRequest({
        to: target.email,
        toUserId: target.id,
        fromName: viewer.name,
      }),
    ]),
  );

  refresh({ kind: "friendship", otherId: target.id });
  // The button lives on the middle person's page, so that's what redraws.
  if (viaChain) refresh({ kind: "friendship", otherId: viaId });
  return {};
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
