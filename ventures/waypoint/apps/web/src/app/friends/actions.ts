"use server";

/**
 * Friend request lifecycle (ticket 18). Requests are a single `friendship`
 * row with status "pending"/"accepted" and origin "request" — the
 * profile-bubble-tap flow from ticket 01 step 2 resolves here whichever way
 * the two people met.
 */
import { and, eq, isNull, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { friendship, user } from "@/db/schema";
import { requireUser } from "@/lib/access";
import { emails, sendEmail } from "@/lib/email";
import { relationTo } from "@/lib/visibility";

/**
 * Opens (or re-opens) a pending request from `viewerId` to `targetId`.
 *
 * An upsert, not an insert: cancelling a request — or declining one, or
 * removing a friend — soft-deletes the row, but `friendship_pair_idx` is
 * unique on (user_id, friend_id) with no `deleted_at` in it, so a plain insert
 * of the same pair a second time hits a UNIQUE constraint and throws. The
 * soft-deleted row is the row we want back, so revive it in place.
 */
async function openPendingRequest(viewerId: string, targetId: string): Promise<void> {
  await db
    .insert(friendship)
    .values({
      userId: viewerId,
      friendId: targetId,
      status: "pending",
      origin: "request",
    })
    .onConflictDoUpdate({
      target: [friendship.userId, friendship.friendId],
      set: {
        status: "pending",
        origin: "request",
        deletedAt: null,
        lastModifiedAt: new Date(),
      },
    });
}

/**
 * Sends a friend request by email. Deliberately silent on whether the email
 * is a registered account — same response either way — so this can't be used
 * to probe account existence (house rule: never leak whether an email is
 * registered).
 */
export async function requestFriend(formData: FormData): Promise<{ error?: string }> {
  const viewer = await requireUser();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { error: "Enter an email address." };

  const target = await db.select().from(user).where(eq(user.email, email)).get();

  if (!target) {
    // Same outward result as a successful send — no account-existence leak.
    return {};
  }

  if (target.id === viewer.id) {
    return { error: "You can't friend yourself." };
  }

  const existing = await db
    .select()
    .from(friendship)
    .where(
      and(
        isNull(friendship.deletedAt),
        or(
          and(eq(friendship.userId, viewer.id), eq(friendship.friendId, target.id)),
          and(eq(friendship.userId, target.id), eq(friendship.friendId, viewer.id)),
        ),
      ),
    )
    .get();

  if (existing) {
    // Already friends, or a request already sitting in one direction —
    // refuse the duplicate quietly rather than explaining which case it is.
    return {};
  }

  await openPendingRequest(viewer.id, target.id);

  await sendEmail(
    emails.friendRequest({
      to: target.email,
      toUserId: target.id,
      fromName: viewer.name,
    }),
  );

  revalidatePath("/friends");
  return {};
}

/**
 * Sends a friend request to someone you're already looking at — their profile,
 * or their row on a trip you share (ticket 96). Same lifecycle as
 * `requestFriend`; only the way you name them differs.
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

  const target = await db.select().from(user).where(eq(user.id, targetId)).get();
  if (!target) return {};

  const existing = await db
    .select()
    .from(friendship)
    .where(
      and(
        isNull(friendship.deletedAt),
        or(
          and(eq(friendship.userId, viewer.id), eq(friendship.friendId, target.id)),
          and(eq(friendship.userId, target.id), eq(friendship.friendId, viewer.id)),
        ),
      ),
    )
    .get();

  // Already friends, or a request already sitting in one direction — refuse
  // the duplicate quietly, same as the by-email path.
  if (existing) return {};

  await openPendingRequest(viewer.id, target.id);

  await sendEmail(
    emails.friendRequest({
      to: target.email,
      toUserId: target.id,
      fromName: viewer.name,
    }),
  );

  revalidatePath("/friends");
  revalidatePath(`/profile/${target.id}`);
  return {};
}

export async function acceptFriend(formData: FormData): Promise<void> {
  const viewer = await requireUser();
  const requesterId = String(formData.get("requesterId") ?? "");

  await db
    .update(friendship)
    .set({ status: "accepted", lastModifiedAt: new Date() })
    .where(
      and(
        eq(friendship.userId, requesterId),
        eq(friendship.friendId, viewer.id),
        eq(friendship.status, "pending"),
        isNull(friendship.deletedAt),
      ),
    );

  revalidatePath("/friends");
  revalidatePath(`/profile/${requesterId}`);
}

export async function declineFriend(formData: FormData): Promise<void> {
  const viewer = await requireUser();
  const requesterId = String(formData.get("requesterId") ?? "");

  await db
    .update(friendship)
    .set({ deletedAt: new Date(), lastModifiedAt: new Date() })
    .where(
      and(
        eq(friendship.userId, requesterId),
        eq(friendship.friendId, viewer.id),
        eq(friendship.status, "pending"),
        isNull(friendship.deletedAt),
      ),
    );

  revalidatePath("/friends");
  revalidatePath(`/profile/${requesterId}`);
}

export async function cancelRequest(formData: FormData): Promise<void> {
  const viewer = await requireUser();
  const targetId = String(formData.get("targetId") ?? "");

  await db
    .update(friendship)
    .set({ deletedAt: new Date(), lastModifiedAt: new Date() })
    .where(
      and(
        eq(friendship.userId, viewer.id),
        eq(friendship.friendId, targetId),
        eq(friendship.status, "pending"),
        isNull(friendship.deletedAt),
      ),
    );

  revalidatePath("/friends");
  revalidatePath(`/profile/${targetId}`);
}

/** Soft-delete either direction of an accepted friendship. */
export async function removeFriend(formData: FormData): Promise<void> {
  const viewer = await requireUser();
  const otherId = String(formData.get("otherId") ?? "");

  await db
    .update(friendship)
    .set({ deletedAt: new Date(), lastModifiedAt: new Date() })
    .where(
      and(
        eq(friendship.status, "accepted"),
        isNull(friendship.deletedAt),
        or(
          and(eq(friendship.userId, viewer.id), eq(friendship.friendId, otherId)),
          and(eq(friendship.userId, otherId), eq(friendship.friendId, viewer.id)),
        ),
      ),
    );

  revalidatePath("/friends");
  revalidatePath(`/profile/${otherId}`);
}
