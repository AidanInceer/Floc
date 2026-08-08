"use server";

/**
 * Friend request lifecycle (ticket 18). Requests are a single `friendship`
 * row with status "pending"/"accepted" and origin "request" — the
 * profile-bubble-tap flow from ticket 01 step 2 resolves here whichever way
 * the two people met.
 *
 * The writes are `server/friends.ts`'s (ticket 108); this file decides who may
 * open a request and what the other person is told.
 */
import { after } from "next/server";

import { requireUser } from "@/server/access";
import { emails, sendEmails } from "@/server/email";
import {
  acceptPendingRequest,
  dropFriendship,
  dropPendingRequest,
  findUserById,
  friendOfFriend,
  friendshipBetween,
  openPendingRequest,
  revalidateFriendship,
} from "@/server/friends";
import { canSeeFriendsOf, relationTo } from "@/server/visibility";

/**
 * Sends a friend request to someone you're already looking at — their profile,
 * or their row on a trip you share (ticket 96). This is the only way to open a
 * request: you meet people by sharing a trip, not by typing an email address,
 * so the old add-by-email form is gone.
 *
 * The id is never trusted on its own. `relationTo` re-checks that the target
 * is inside one of your rings, exactly as the profile page does — without it,
 * this action would hand back "is this a real account?" for any id posted at
 * it, which is the hole `/profile/<userId>` closed (ticket 46).
 */
export async function requestFriendById(formData: FormData): Promise<{ error?: string }> {
  const viewer = await requireUser();
  const targetId = String(formData.get("targetId") ?? "");
  if (!targetId || targetId === viewer.id) return {};

  /*
   * The second way in (ticket 145): somebody you met on a friend's friends
   * list, who is in none of your rings and whose profile still 404s for you.
   *
   * `viaId` is the page you found them on, and it buys nothing on its own —
   * the whole chain is re-derived here. Both halves have to be *accepted*
   * friendships, and the middle person has to have been showing you their
   * list in the first place, which is the check that keeps this from becoming
   * "post any two ids and learn whether they know each other".
   */
  const viaId = String(formData.get("viaId") ?? "");
  const viaChain = viaId
    ? (await friendOfFriend(viewer.id, viaId, targetId)) &&
      (await canSeeFriendsOf(viaId, viewer.id))
    : false;

  const relation = await relationTo(viewer.id, targetId);
  if ((!relation || relation === "self") && !viaChain) return {};

  const target = await findUserById(targetId);
  if (!target) return {};

  // Already friends, or a request already sitting in one direction — refuse
  // the duplicate quietly rather than explaining which case it is.
  if (await friendshipBetween(viewer.id, target.id)) return {};

  await openPendingRequest(viewer.id, target.id);

  // The request exists once the row is written; telling them about it is a
  // side effect and runs after the response (ticket 111).
  after(() =>
    sendEmails([
      emails.friendRequest({
        to: target.email,
        toUserId: target.id,
        fromName: viewer.name,
      }),
    ]),
  );

  revalidateFriendship(target.id);
  // The button that sent this is on the middle person's page, not the
  // target's, so that's the one that has to redraw.
  if (viaChain) revalidateFriendship(viaId);
  return {};
}

export async function acceptFriend(formData: FormData): Promise<void> {
  const viewer = await requireUser();
  const requesterId = String(formData.get("requesterId") ?? "");

  await acceptPendingRequest(requesterId, viewer.id);

  revalidateFriendship(requesterId);
}

export async function declineFriend(formData: FormData): Promise<void> {
  const viewer = await requireUser();
  const requesterId = String(formData.get("requesterId") ?? "");

  await dropPendingRequest(requesterId, viewer.id);

  revalidateFriendship(requesterId);
}

export async function cancelRequest(formData: FormData): Promise<void> {
  const viewer = await requireUser();
  const targetId = String(formData.get("targetId") ?? "");

  // The same write as declining, from the other end of the pair.
  await dropPendingRequest(viewer.id, targetId);

  revalidateFriendship(targetId);
}

/** Soft-delete either direction of an accepted friendship. */
export async function removeFriend(formData: FormData): Promise<void> {
  const viewer = await requireUser();
  const otherId = String(formData.get("otherId") ?? "");

  await dropFriendship(viewer.id, otherId);

  revalidateFriendship(otherId);
}
