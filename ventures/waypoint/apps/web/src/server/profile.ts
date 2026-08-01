/**
 * `user_profile` is our extension of Better Auth's user table (ticket 06) —
 * created lazily so a user who signed up before a column existed still works.
 */
import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { userProfile } from "@/db/schema";
import type { SignupChannel, UserProfile } from "@/db/schema";

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
