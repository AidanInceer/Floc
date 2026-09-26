/**
 * Deleting an account (ticket 06). The `user` row stays: expenses, splits and
 * notes point at it, and splits are snapshots (rule 2). Everything that made
 * it a person goes — name, address, profile, sign-in methods, sessions, phones,
 * friends, private files — so the row that is left names nobody.
 */
import "server-only";

import { and, eq, isNull, or } from "drizzle-orm";

import { db } from "@/db";
import {
  account,
  document,
  exploreSave,
  friendship,
  packingKit,
  packingLine,
  pushToken,
  session,
  tripInvite,
  user,
  userCountryMark,
  userProfile,
} from "@/db/schema";
import { dropDocument } from "@/server/documents/document-store";
import { handOverAndLeaveAllTrips } from "@/server/trips/roster";

export const ERASED_NAME = "Deleted user";

export async function eraseAccount(userId: string): Promise<void> {
  await handOverAndLeaveAllTrips(userId);

  const now = new Date();
  const privateFiles = await db.transaction(async (tx) => {
    await tx
      .update(user)
      .set({
        name: ERASED_NAME,
        // Why: unique and unroutable, so the real address is free to sign up again.
        email: `erased-${userId}@erased.invalid`,
        emailVerified: false,
        image: null,
        updatedAt: now,
      })
      .where(eq(user.id, userId));
    await tx
      .update(userProfile)
      .set({
        displayName: null,
        avatarIcon: null,
        vibeTags: null,
        signupChannel: null,
        dietFlags: null,
        dietaryNotes: null,
        shareDietary: false,
        isPrivate: true,
        exploreAnswers: null,
        friendCode: null,
        notifyPush: false,
        notifyEmail: false,
        notifyReminders: false,
        lastModifiedAt: now,
      })
      .where(eq(userProfile.userId, userId));

    await tx.delete(session).where(eq(session.userId, userId));
    await tx.delete(account).where(eq(account.userId, userId));
    await tx.delete(pushToken).where(eq(pushToken.userId, userId));
    await tx.delete(userCountryMark).where(eq(userCountryMark.userId, userId));

    const gone = { deletedAt: now, lastModifiedAt: now };
    await tx
      .update(friendship)
      .set(gone)
      .where(
        and(
          or(eq(friendship.userId, userId), eq(friendship.friendId, userId)),
          isNull(friendship.deletedAt),
        ),
      );
    await tx
      .update(tripInvite)
      .set(gone)
      .where(
        and(
          or(eq(tripInvite.fromUserId, userId), eq(tripInvite.toUserId, userId)),
          isNull(tripInvite.deletedAt),
        ),
      );
    await tx
      .update(exploreSave)
      .set(gone)
      .where(and(eq(exploreSave.userId, userId), isNull(exploreSave.deletedAt)));
    await tx
      .update(packingKit)
      .set(gone)
      .where(and(eq(packingKit.ownerId, userId), isNull(packingKit.deletedAt)));
    await tx
      .update(packingLine)
      .set(gone)
      .where(and(eq(packingLine.ownerId, userId), isNull(packingLine.deletedAt)));

    return tx
      .update(document)
      .set(gone)
      .where(
        and(eq(document.ownerId, userId), isNull(document.deletedAt)),
      )
      .returning({ storageKey: document.storageKey })
      .all();
  });

  await Promise.all(privateFiles.map((file) => dropDocument(file.storageKey)));
}
