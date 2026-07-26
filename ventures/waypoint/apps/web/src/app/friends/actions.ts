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

  await db.insert(friendship).values({
    userId: viewer.id,
    friendId: target.id,
    status: "pending",
    origin: "request",
  });

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
}
