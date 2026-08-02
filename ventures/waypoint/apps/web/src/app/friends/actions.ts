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
import { requireUser } from "@/server/access";
import { emails, sendEmail } from "@/server/email";
import {
  acceptPendingRequest,
  dropFriendship,
  dropPendingRequest,
  findUserById,
  friendshipBetween,
  openPendingRequest,
  revalidateFriendship,
} from "@/server/friends";
import { relationTo } from "@/server/visibility";

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

  const relation = await relationTo(viewer.id, targetId);
  if (!relation || relation === "self") return {};

  const target = await findUserById(targetId);
  if (!target) return {};

  // Already friends, or a request already sitting in one direction — refuse
  // the duplicate quietly rather than explaining which case it is.
  if (await friendshipBetween(viewer.id, target.id)) return {};

  await openPendingRequest(viewer.id, target.id);

  await sendEmail(
    emails.friendRequest({
      to: target.email,
      toUserId: target.id,
      fromName: viewer.name,
    }),
  );

  revalidateFriendship(target.id);
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
