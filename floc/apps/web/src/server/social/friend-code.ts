import "server-only";

import { randomBytes } from "node:crypto";
import { and, eq, isNull, sql } from "drizzle-orm";
import { friendTagNameKey, generateFriendTagSuffix, readFriendQuery } from "@floc/core/people/friend-query";
import type { FriendSearch } from "@floc/api/port";

import { db } from "@/db";
import { user, userProfile } from "@/db/schema";
import { ensureProfile } from "@/server/auth/profile";
import { writeLimiter } from "@/server/http/write-limiter";
import { friendStateWith, openPendingRequest, peopleByIds } from "@/server/social/friends";

const ATTEMPTS = 8;
const processState = globalThis as typeof globalThis & { flocFriendTagGuesses?: ReturnType<typeof writeLimiter> };
const guesses = processState.flocFriendTagGuesses ??= writeLimiter({ capacity: 12, perSecond: 1 / 60 });

const shownName = sql<string>`coalesce(${userProfile.displayName}, (select ${user.name} from ${user} where ${user.id} = ${userProfile.userId}))`;
const keyFor = (tag: string) => `${friendTagNameKey(tag.slice(0, -5))}${tag.slice(-5)}`;

export async function friendCodeFor(userId: string): Promise<string> {
  for (let i = 0; i < ATTEMPTS; i++) {
    const profile = await db
      .select({ name: shownName, tag: userProfile.friendTag })
      .from(userProfile)
      .where(eq(userProfile.userId, userId))
      .get();
    if (!profile) {
      await ensureProfile(userId);
      continue;
    }
    const { name, tag } = profile;
    if (tag && tag.slice(0, -5) === friendTagNameKey(name)) return `${name.trim()}${tag.slice(-5)}`;

    const next = `${name.trim()}#${generateFriendTagSuffix(randomBytes)}`;
    const key = keyFor(next);
    const [saved] = await db
      .update(userProfile)
      .set({ friendTag: key })
      .where(and(
        eq(userProfile.userId, userId),
        eq(shownName, name),
        tag ? eq(userProfile.friendTag, tag) : isNull(userProfile.friendTag),
        sql`not exists (select 1 from user_profile as holder where holder.friend_tag = ${key})`,
      ))
      .returning({ tag: userProfile.friendTag });
    if (saved) return next;
  }
  throw new Error("Could not issue a friend tag");
}

export async function lookupFriendTag(viewerId: string, code: string): Promise<Extract<FriendSearch, { kind: "code" }>> {
  if (!guesses.allow(viewerId)) return { kind: "code", code, person: null, limited: true };
  const key = keyFor(code);
  const holder = await db
    .select({ userId: userProfile.userId, name: shownName })
    .from(userProfile)
    .where(eq(userProfile.friendTag, key))
    .get();
  if (!holder || holder.userId === viewerId || friendTagNameKey(holder.name) !== key.slice(0, -5)) {
    return { kind: "code", code, person: null };
  }
  const person = (await peopleByIds([holder.userId])).get(holder.userId);
  return {
    kind: "code",
    code,
    person: person ? { ...person, state: await friendStateWith(viewerId, holder.userId) } : null,
  };
}

export async function requestByCode(viewerId: string, code: string) {
  const query = readFriendQuery(code);
  if (query?.kind !== "code") return null;
  const { person } = await lookupFriendTag(viewerId, query.code);
  if (!person || person.state !== "none") return person;
  await openPendingRequest(viewerId, person.id, "code");
  return { ...person, state: "outgoing" as const };
}
