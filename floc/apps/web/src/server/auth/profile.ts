import type { AvatarIcon } from "@floc/core/people/avatar-icon";
import "server-only";

import { eq, inArray } from "drizzle-orm";
import { cache } from "react";

import { db } from "@/db";
import { user, userProfile } from "@/db/schema";
import type { Currency, SignupChannel, UserProfile } from "@/db/schema";
import { refresh, type Fact } from "@/server/freshness";

export async function getProfile(
  userId: string,
): Promise<UserProfile | undefined> {
  return db.select().from(userProfile).where(eq(userProfile.userId, userId)).get();
}

export const readProfile = cache(getProfile);

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

export async function updateProfileFields(
  userId: string,
  patch: Partial<Omit<UserProfile, "userId" | "createdAt" | "lastModifiedAt">>,
): Promise<void> {
  await db
    .update(userProfile)
    .set({ ...patch, lastModifiedAt: new Date() })
    .where(eq(userProfile.userId, userId));
}

type ProfilePatch = Parameters<typeof updateProfileFields>[1];

async function saveAndRefresh(userId: string, patch: ProfilePatch, ...facts: Fact[]): Promise<void> {
  await ensureProfile(userId);
  await updateProfileFields(userId, patch);
  refresh(...facts);
}

export const saveProfile = (userId: string, patch: ProfilePatch) =>
  saveAndRefresh(userId, patch, { kind: "profile" });

export const saveFace = (userId: string, patch: Pick<ProfilePatch, "displayName" | "avatarIcon">) =>
  saveAndRefresh(userId, patch, { kind: "profile" }, { kind: "tripList" });

export async function loadIdentity(
  userId: string,
): Promise<
  | { id: string; name: string; email: string; emailVerified: boolean; avatarIcon: AvatarIcon | null }
  | undefined
> {
  const row = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image,
      displayName: userProfile.displayName,
      avatarIcon: userProfile.avatarIcon,
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
    emailVerified: row.emailVerified,
    avatarIcon: row.avatarIcon,
  };
}

export async function homeCurrenciesFor(userIds: string[]): Promise<Map<string, Currency>> {
  if (userIds.length === 0) return new Map();
  const rows = await db
    .select({ userId: userProfile.userId, home: userProfile.homeCurrency })
    .from(userProfile)
    .where(inArray(userProfile.userId, userIds))
    .all();
  const found = new Map(rows.map((r) => [r.userId, r.home ?? "GBP"] as const));
  return new Map(userIds.map((id) => [id, found.get(id) ?? "GBP"]));
}
