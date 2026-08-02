/**
 * Better Auth (ticket 03) — user rows live in our own libSQL database so they
 * can carry FKs to trips, profiles and consent.
 *
 * Ticket 06: Google + email/password at launch, Facebook is a fast-follow.
 * Auto-link only on a *verified* provider email matching an existing account.
 * Long rolling sessions, no re-authentication anywhere in v1.
 */
import "server-only";

import { eq } from "drizzle-orm";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { requireInProduction } from "@/lib/env";

const googleConfigured =
  !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;

/** Exposed so the auth pages can hide a provider button that cannot work. */
export const enabledProviders = {
  google: googleConfigured,
  /** Facebook is deliberately not wired in v1 (ticket 06). */
  facebook: false,
} as const;

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  // Ticket 112: fatal in production if unset. A session secret has no degraded
  // mode — a deploy signing cookies with a value from the repo is an auth
  // bypass, not a reduced feature set.
  secret: requireInProduction("BETTER_AUTH_SECRET", "dev-only-secret-change-me"),
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    // No email verification gate in v1: nothing in the product is gated on it,
    // and the invite flow needs the fewest possible steps (ticket 01).
    requireEmailVerification: false,
  },
  socialProviders: googleConfigured
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
      }
    : {},
  account: {
    accountLinking: {
      enabled: true,
      // Safe only because Google reports verified emails; an unverified-email
      // collision is refused and the user is told to sign in as they first did.
      trustedProviders: ["google"],
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 60, // 60 days
    updateAge: 60 * 60 * 24, // rolling: refreshed at most once a day
    /*
     * Every server render resolves the session before it can do anything else
     * — it's the first serial database round trip of every page and every
     * action. This caches the session in a signed cookie so that lookup only
     * happens once a minute instead of once a request.
     *
     * The cost is that session *revocation* (signing out elsewhere, deleting
     * the account) lags by up to `maxAge`. Sixty seconds is chosen to keep
     * that window short; nothing else in the app is gated on it, because trip
     * membership is read from the database on every request regardless — see
     * `requireTripAccess` — so a kicked member still loses access instantly.
     */
    cookieCache: {
      enabled: true,
      maxAge: 60,
    },
  },
  user: {
    deleteUser: {
      // Soft in effect: content stays attributed to a placeholder and
      // expense_split rows are frozen (ticket 06). See lib/account.ts.
      enabled: true,
    },
  },
});

export type Session = typeof auth.$Infer.Session;

/**
 * The linked sign-in methods on one account, and the one way to remove one
 * (ticket 108). Better Auth owns the `account` table, so these two sit beside
 * its config rather than in a module of their own — but the *rule* that you
 * cannot unlink your last credential is the caller's, because it is a message
 * to a person, not a constraint on the row.
 */
export async function listLinkedAccounts(userId: string) {
  return db.select().from(schema.account).where(eq(schema.account.userId, userId)).all();
}

export async function unlinkAccountById(accountId: string): Promise<void> {
  await db.delete(schema.account).where(eq(schema.account.id, accountId));
}
