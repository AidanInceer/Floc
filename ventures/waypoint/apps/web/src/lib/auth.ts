/**
 * Better Auth (ticket 03) — user rows live in our own libSQL database so they
 * can carry FKs to trips, profiles and consent.
 *
 * Ticket 06: Google + email/password at launch, Facebook is a fast-follow.
 * Auto-link only on a *verified* provider email matching an existing account.
 * Long rolling sessions, no re-authentication anywhere in v1.
 */
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "@/db";
import * as schema from "@/db/schema";

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
  secret: process.env.BETTER_AUTH_SECRET ?? "dev-only-secret-change-me",
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
