/**
 * Seeded people, and the passwords that let you *be* them (#no-ticket).
 *
 * WHY A PASSWORD AT ALL. The old seed wrote users with no credential, so the
 * only account you could sign in as was your own — and half of what needs
 * testing (somebody else claimed that jumper, somebody else paid) is invisible
 * from one seat. A credential row here plus the picker on the dev sign-in door
 * turns the seed into something you can walk around inside.
 *
 * `hashPassword` is Better Auth's own, so these rows are byte-identical to
 * what signing up through the form writes. There is no second definition of a
 * password to drift.
 */
import { randomUUID } from "node:crypto";

import { and, eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";

import { db } from "../index.ts";
import { account, friendship, user, userCountryMark, userProfile } from "../schema.ts";
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

/** Upserts rather than skipping — otherwise re-seeding never rolls a new column forward. */
async function upsertAccount(args: {
  /** Used only when the account is new, so a fresh database always gets the same ids. */
  id: string;
  email: string;
  password: string;
  name: string;
  profile: Profile;
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
    signupChannel: "direct" as const,
    dietFlags: profile.diet?.flags ?? [],
    dietaryNotes: profile.diet?.notes ?? null,
    shareDietary: profile.diet?.shared ?? false,
    ...profile.rings,
  };
  await db
    .insert(userProfile)
    .values({ userId: id, ...fields })
    .onConflictDoUpdate({ target: userProfile.userId, set: fields });

  await paintMap(id, profile.map);

  return id;
}

/** Hand marks only; replaced wholesale so a re-seed never keeps a stale country. */
async function paintMap(userId: string, map: Profile["map"]): Promise<void> {
  await db.delete(userCountryMark).where(eq(userCountryMark.userId, userId));
  const rows = [
    ...(map?.green ?? []).map((countryCode) => ({ userId, countryCode, state: "green" as const })),
    ...(map?.yellow ?? []).map((countryCode) => ({ userId, countryCode, state: "yellow" as const })),
  ];
  if (rows.length > 0) await db.insert(userCountryMark).values(rows);
}

export async function seedPerson(person: Person, scenario: Scenario): Promise<string> {
  return upsertAccount({
    id: `seed-${scenario}-${person.handle}`,
    email: seedEmail(person.handle, scenario),
    password: SEED_PASSWORD,
    name: person.name,
    profile: person.profile,
  });
}

/**
 * The account the dev sign-in button uses. Seeded too, so a wiped database is
 * one command from working rather than a sign-up form and a fresh password.
 */
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
    },
  });
}

/** Canonical lower-id-first direction, matching `friendship_pair_idx`. */
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

/**
 * A request *they* sent *you*, waiting on the friends tab.
 *
 * Not sorted lower-id-first the way `befriend` sorts: a pending row stores the
 * asker in `user_id`, and that is the only thing telling incoming from
 * outgoing at read time (`friendStateWith`). Sorting the pair here would flip
 * half the requests into ones you appear to have sent.
 */
export async function requestFriendship(from: string, to: string): Promise<void> {
  await db
    .insert(friendship)
    .values({ userId: from, friendId: to, status: "pending", origin: "request" })
    .onConflictDoUpdate({
      target: [friendship.userId, friendship.friendId],
      set: { status: "pending", deletedAt: null },
    });
}
