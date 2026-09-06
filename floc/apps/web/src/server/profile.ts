/**
 * `user_profile` is our extension of Better Auth's user table (ticket 06) —
 * created lazily so a user who signed up before a column existed still works.
 */
import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { account, user, userProfile } from "@/db/schema";
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

/**
 * Name, email and picture for one person — the account row and its profile
 * extension read as one (ticket 302). The display name wins over the signup
 * name because that is the whole point of curating one; `undefined` means the
 * account itself has gone, which is not the same as having no profile row.
 */
export async function loadIdentity(
  userId: string,
): Promise<{ id: string; name: string; email: string; avatarUrl: string | null } | undefined> {
  const row = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      displayName: userProfile.displayName,
      avatarUrl: userProfile.avatarUrl,
    })
    .from(user)
    .leftJoin(userProfile, eq(userProfile.userId, user.id))
    .where(eq(user.id, userId))
    .get();
  if (!row) return undefined;

  return {
    id: row.id,
    name: row.displayName ?? row.name,
    email: row.email,
    avatarUrl: row.avatarUrl ?? row.image ?? null,
  };
}
