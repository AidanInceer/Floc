/**
 * Why: anyone can sign up with an address they do not own, and Google links
 * onto an existing account by address. When it links onto an unconfirmed one,
 * nothing proved who set that password — so the password goes, and every
 * session it opened goes with it. The Google sign-in makes its own session
 * after this runs.
 */
import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { account, session, user } from "@/db/schema";

export async function dropUnprovenPassword(userId: string, providerId: string): Promise<void> {
  if (providerId === "credential") return;

  const owner = await db
    .select({ emailVerified: user.emailVerified })
    .from(user)
    .where(eq(user.id, userId))
    .get();
  if (!owner || owner.emailVerified) return;

  await db.transaction(async (tx) => {
    await tx
      .delete(account)
      .where(and(eq(account.userId, userId), eq(account.providerId, "credential")));
    await tx.delete(session).where(eq(session.userId, userId));
  });
}
