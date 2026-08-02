/**
 * `user_profile` is our extension of Better Auth's user table (ticket 06) —
 * created lazily so a user who signed up before a column existed still works.
 */
import "server-only";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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

/** Every profile edit lands on the same page. */
export function revalidateProfile(): void {
  revalidatePath("/profile");
}

/**
 * Writes a patch of profile fields (ticket 108). One function rather than one
 * per section: the three forms on /profile write disjoint columns of the same
 * row, and the only rule they share — stamp `last_modified_at` — belongs here
 * rather than in each of them.
 *
 * Which fields are *valid* is not decided here. `parseDietFlags`,
 * `parseVibeTags` and the currency check are pure and live in `lib/`, and the
 * action calls them before this ever sees a value.
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
