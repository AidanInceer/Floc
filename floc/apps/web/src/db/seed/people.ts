import { randomUUID } from "node:crypto";

import { and, eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";

import { db } from "../index.ts";
import { account, exploreSave, friendship, user, userCountryMark, userProfile } from "../schema.ts";
import { SEED_PASSWORD, type Scenario, seedEmail } from "./identity.ts";
import { OPEN, type Profile } from "./profiles.ts";

export type Person = { handle: string; name: string; profile: Profile };

async function setPassword(userId: string, password: string): Promise<void> {
  const hash = await hashPassword(password);
  const existing = await db
    .select({ id: account.id })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, "credential")))
    .get();

  if (existing) {
    await db.update(account).set({ password: hash }).where(eq(account.id, existing.id));
    return;
  }

  await db.insert(account).values({
    id: randomUUID(),
    accountId: userId,
    providerId: "credential",
    userId,
    password: hash,
  });
}

export async function upsertAccount(args: {
  id: string;
  email: string;
  password: string;
  name: string;
  profile: Profile;
  welcomed?: boolean;
}): Promise<string> {
  const existing = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, args.email))
    .get();

  const id = existing?.id ?? args.id;
  if (!existing) {
    await db
      .insert(user)
      .values({ id, name: args.name, email: args.email, emailVerified: true });
  }

  await setPassword(id, args.password);

  const { profile } = args;
  const fields = {
    displayName: args.name,
    homeCurrency: profile.currency,
    vibeTags: profile.vibes,
    tourSeenAt: args.welcomed ? new Date() : null,
    ...profile.rings,
  };
  await db
    .insert(userProfile)
    .values({ userId: id, ...fields })
    .onConflictDoUpdate({ target: userProfile.userId, set: fields });

  await paintMap(id, profile.map);
  await saveTrips(id, profile.saves);

  return id;
}

async function saveTrips(userId: string, saves: Profile["saves"]): Promise<void> {
  await db.delete(exploreSave).where(eq(exploreSave.userId, userId));
  if (saves?.length) {
    await db.insert(exploreSave).values(saves.map((presetId) => ({ userId, presetId })));
  }
}

async function paintMap(userId: string, map: Profile["map"]): Promise<void> {
  await db.delete(userCountryMark).where(eq(userCountryMark.userId, userId));
  const rows = [
    ...(map?.green ?? []).map((countryCode) => ({ userId, countryCode, state: "green" as const })),
    ...(map?.yellow ?? []).map((countryCode) => ({ userId, countryCode, state: "yellow" as const })),
  ];
  if (rows.length > 0) await db.insert(userCountryMark).values(rows);
}

export async function seedGuest(args: { id: string; email: string; name: string }): Promise<string> {
  await db.insert(user).values({ ...args, emailVerified: false, isAnonymous: true });
  await setPassword(args.id, SEED_PASSWORD);
  return args.id;
}

export async function seedPerson(person: Person, scenario: Scenario): Promise<string> {
  return upsertAccount({
    id: `seed-${scenario}-${person.handle}`,
    email: seedEmail(person.handle, scenario),
    password: SEED_PASSWORD,
    name: person.name,
    profile: person.profile,
    welcomed: true,
  });
}

export async function ensureDevUser(): Promise<string> {
  const email = process.env.FLOC_DEV_USER_EMAIL;
  const password = process.env.FLOC_DEV_USER_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "Set FLOC_DEV_USER_EMAIL and FLOC_DEV_USER_PASSWORD in floc/apps/web/.env — the seed hangs its trips off that account.",
    );
  }
  return upsertAccount({
    id: "dev-user",
    email,
    password,
    name: process.env.FLOC_DEV_USER_NAME ?? "Dev user",
    profile: {
      vibes: ["city breaks", "food first"],
      currency: "GBP",
      rings: OPEN,
      map: { green: ["FR", "ES"], yellow: ["JP"] },
      saves: ["porto-to-seville", "peru-sacred-valley"],
    },
    welcomed: true,
  });
}

export async function befriend(
  a: string,
  b: string,
  status: "accepted" | "pending" = "accepted",
): Promise<void> {
  const [lo, hi] = a < b ? [a, b] : [b, a];
  await db
    .insert(friendship)
    .values({ userId: lo, friendId: hi, status, origin: "request" })
    .onConflictDoUpdate({
      target: [friendship.userId, friendship.friendId],
      set: { status, deletedAt: null },
    });
}

export async function requestFriendship(from: string, to: string): Promise<void> {
  await db
    .insert(friendship)
    .values({ userId: from, friendId: to, status: "pending", origin: "request" })
    .onConflictDoUpdate({
      target: [friendship.userId, friendship.friendId],
      set: { status: "pending", deletedAt: null },
    });
}
