/**
 * A person's friend code (#360): handed out by its owner, so whoever types it
 * may see who it belongs to. Eight characters from 31 is ~10¹² codes — too
 * many to walk for a directory.
 */
import "server-only";

import { randomBytes } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { generateFriendCode } from "@floc/core/people/friend-query";

import { db } from "@/db";
import { userProfile } from "@/db/schema";
import { ensureProfile, getProfile } from "@/server/auth/profile";
import type { FoundPerson } from "@/server/social/find-friends";
import { friendStateWith, openPendingRequest, peopleByIds } from "@/server/social/friends";

const ATTEMPTS = 5;

export async function friendCodeFor(userId: string): Promise<string> {
  const profile = await ensureProfile(userId);
  if (profile.friendCode) return profile.friendCode;

  let lastError: unknown;
  for (let i = 0; i < ATTEMPTS; i++) {
    try {
      // `isNull` so two first looks at once both end up with the winner's code.
      await db
        .update(userProfile)
        .set({ friendCode: generateFriendCode((n) => randomBytes(n)) })
        .where(and(eq(userProfile.userId, userId), isNull(userProfile.friendCode)));
    } catch (error) {
      lastError = error; // a code someone already holds; draw again
      continue;
    }
    const code = (await getProfile(userId))?.friendCode;
    if (code) return code;
  }
  throw lastError ?? new Error("Could not make a friend code");
}

/** Null when nobody holds the code — the code is secret, the account behind it isn't. */
export async function findByCode(viewerId: string, code: string): Promise<FoundPerson | null> {
  const holder = await db
    .select({ userId: userProfile.userId })
    .from(userProfile)
    .where(eq(userProfile.friendCode, code))
    .get();
  if (!holder || holder.userId === viewerId) return null;

  const person = (await peopleByIds([holder.userId])).get(holder.userId);
  if (!person) return null;
  return { ...person, state: await friendStateWith(viewerId, holder.userId) };
}

export async function requestByCode(
  viewerId: string,
  code: string,
): Promise<FoundPerson | null> {
  const found = await findByCode(viewerId, code);
  if (!found || found.state !== "none") return found;

  await openPendingRequest(viewerId, found.id, "code");
  return { ...found, state: "outgoing" };
}
