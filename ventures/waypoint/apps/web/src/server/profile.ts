/**
 * `user_profile` is our extension of Better Auth's user table (ticket 06) —
 * created lazily so a user who signed up before a column existed still works.
 */
import "server-only";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { account, userProfile } from "@/db/schema";
import type { SignupChannel, UserProfile } from "@/db/schema";

/** Sign-in methods on an account (ticket 118), for Settings to offer unlinking. Read-only — unlinking goes through the action's own last-credential guard. */
export async function listLinkedAccounts(
  userId: string,
): Promise<{ id: string; providerId: string }[]> {
  return db
    .select({ id: account.id, providerId: account.providerId })
    .from(account)
    .where(eq(account.userId, userId))
    .all();
}

export async function getProfile(
  userId: string,
): Promise<UserProfile | undefined> {
  return db.select().from(userProfile).where(eq(userProfile.userId, userId)).get();
}

export async function ensureProfile(
  userId: string,
  seed?: { signupChannel?: SignupChannel | null },
): Promise<UserProfile> {
  const existing = await getProfile(userId);
  if (existing) return existing;

  await db
    .insert(userProfile)
    .values({ userId, signupChannel: seed?.signupChannel ?? null })
    .onConflictDoNothing();

  const created = await getProfile(userId);
  if (!created) throw new Error("Could not create the user profile");
  return created;
}

/** Every profile edit lands on the same page. */
export function revalidateProfile(): void {
  revalidatePath("/profile");
}

/**
 * Writes a patch of profile fields (ticket 108) — one function rather than one
 * per form section, since the shared `last_modified_at` stamp is the only rule
 * they share. Validation (`parseDietFlags`, `parseVibeTags`, currency) is pure
 * and lives in `lib/`; the action calls it before this ever sees a value.
 */
export async function updateProfileFields(
  userId: string,
  patch: Partial<Omit<UserProfile, "userId" | "createdAt" | "lastModifiedAt">>,
): Promise<void> {
  await db
    .update(userProfile)
    .set({ ...patch, lastModifiedAt: new Date() })
    .where(eq(userProfile.userId, userId));
}
