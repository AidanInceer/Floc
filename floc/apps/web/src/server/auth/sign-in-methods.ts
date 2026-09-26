/**
 * The ways into an account (ticket 108, 118). Better Auth owns `account`; the
 * rule that the last way in cannot be removed is ours, and lives here once for
 * the settings page and the phone.
 */
import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { account } from "@/db/schema";

export async function listSignInMethods(userId: string): Promise<{ id: string; providerId: string }[]> {
  return db
    .select({ id: account.id, providerId: account.providerId })
    .from(account)
    .where(eq(account.userId, userId))
    .all();
}

/** Null when removed; otherwise the sentence that says why not. */
export async function unlinkSignIn(userId: string, accountId: string): Promise<string | null> {
  const linked = await listSignInMethods(userId);
  if (linked.length <= 1) return "You can't unlink your last sign-in method.";
  if (!linked.some((method) => method.id === accountId)) return "That sign-in method isn't linked.";
  await db.delete(account).where(eq(account.id, accountId));
  return null;
}
