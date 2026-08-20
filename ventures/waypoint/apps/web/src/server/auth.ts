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
    // Ticket 149: sign-in is *not* blocked on verification — only joining a
    // trip is (see `requireVerifiedToJoin`). So a fresh password account can
    // sign in and set itself up; it just can't land in someone else's trip
    // until it has proven it owns the inbox.
    requireEmailVerification: false,
  },
  emailVerification: {
    // Ticket 149: the mail goes out at signup. A Google sign-up never reaches
    // here — Google reports the address already verified.
    sendOnSignUp: true,
    // Single-use by construction (Better Auth consumes the token on success)
    // and time-boxed so a leaked link stops working. 1 hour.
    expiresIn: 60 * 60,
    async sendVerificationEmail({ user, url }) {
      const { sendEmails, emails } = await import("@/server/email");
      await sendEmails([emails.verifyEmail({ to: user.email, url })]);
    },
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
      // Defaults to true, which would require the *existing* password account
      // to be verified first. With no mail provider that can never happen, so
      // it locked people out of their own account (#149). Google has already
      // proven the address; asking our side to prove it twice adds nothing.
      requireLocalEmailVerified: false,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 60, // 60 days
    updateAge: 60 * 60 * 24, // rolling: refreshed at most once a day
    // Caches the session in a signed cookie so the lookup happens once a
    // minute instead of once a request. Costs revocation lag up to `maxAge`;
    // 60s keeps that short, and trip membership is still read fresh from the
    // database on every request (see `requireTripAccess`), so a kicked member
    // loses access instantly regardless.
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
 * Linked sign-in methods on an account, and the one way to remove one (ticket
 * 108). Better Auth owns `account`, so these sit beside its config; the rule
 * that you can't unlink your last credential belongs to the caller instead —
 * it's a message to a person, not a constraint on the row.
 */
export async function listLinkedAccounts(userId: string) {
  return db.select().from(schema.account).where(eq(schema.account.userId, userId)).all();
}

export async function unlinkAccountById(accountId: string): Promise<void> {
  await db.delete(schema.account).where(eq(schema.account.id, accountId));
}
