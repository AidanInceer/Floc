/**
 * Better Auth (ticket 03) — user rows live in our own libSQL database so they
 * can carry FKs to trips, profiles and consent.
 *
 * Ticket 06: Google + email/password at launch, Facebook is a fast-follow.
 * Long rolling sessions, no re-authentication anywhere in v1. Deleting an
 * account is ours, not Better Auth's: `server/auth/erase-account.ts`.
 */
import "server-only";

import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer } from "better-auth/plugins";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { requireInProduction } from "@/lib/env";
import { dropUnprovenPassword } from "@/server/auth/link-guard";

const googleConfigured =
  !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;

/** Exposed so the auth pages can hide a provider button that cannot work. */
export const enabledProviders = {
  google: googleConfigured,
  /** Facebook is deliberately not wired in v1 (ticket 06). */
  facebook: false,
} as const;

/**
 * The phone app's deep-link scheme (ticket 289). Better Auth only redirects a
 * social sign-in back to an origin it has been told about, so an unset value
 * here shows up as Google refusing to return to the app.
 */
const MOBILE_SCHEME = process.env.FLOC_MOBILE_SCHEME ?? "floc";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  /**
   * The phone has no cookie jar, so it signs in against this same instance and
   * the same user table, and carries its session as a bearer token instead
   * (ticket 289). Two plugins, one identity: `bearer` accepts that token on
   * the API, `expo` handles the native redirect back out of the browser sheet.
   *
   * Nothing about the browser's session changes — it still uses the cookie it
   * always did, and signing out on a phone leaves it alone.
   */
  plugins: [bearer(), expo()],
  // A phone reaches a dev server by LAN address, never `localhost`, so that
  // origin has to be trusted too or sign-in hangs (ticket 289). Unset in
  // production, where `baseURL` is already the real origin.
  trustedOrigins: [
    `${MOBILE_SCHEME}://`,
    ...(process.env.FLOC_LAN_ORIGIN ? [process.env.FLOC_LAN_ORIGIN] : []),
  ],
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
    // Sign-in is not blocked on verification (#149). A confirmed address only
    // keeps the password when Google later links on — see `link-guard.ts`.
    requireEmailVerification: false,
    // A reset proves the inbox; sessions opened with the old password must end.
    revokeSessionsOnPasswordReset: true,
    // Single-use by construction (Better Auth consumes the token) and short,
    // since it is a bearer credential for the account.
    resetPasswordTokenExpiresIn: 60 * 60,
    async sendResetPassword({ user, url }) {
      const { sendEmails, emails } = await import("@/server/auth/email");
      await sendEmails([emails.resetPassword({ to: user.email, url })]);
    },
  },
  emailVerification: {
    // Ticket 149: the mail goes out at signup. A Google sign-up never reaches
    // here — Google reports the address already verified.
    sendOnSignUp: true,
    // Single-use by construction (Better Auth consumes the token on success)
    // and time-boxed so a leaked link stops working. 1 hour.
    expiresIn: 60 * 60,
    async sendVerificationEmail({ user, url }) {
      const { sendEmails, emails } = await import("@/server/auth/email");
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
    // Google's access and refresh tokens are kept but never used, so at rest they are ciphertext.
    encryptOAuthTokens: true,
    accountLinking: {
      enabled: true,
      // Safe only because Google reports verified emails; an unverified-email
      // collision is refused and the user is told to sign in as they first did.
      trustedProviders: ["google"],
      // Defaults to true, which locked people out when no mail provider could
      // confirm the address (#149). Instead an unconfirmed password is dropped
      // when Google links on (`databaseHooks` below), which stops pre-hijack.
      requireLocalEmailVerified: false,
    },
  },
  databaseHooks: {
    account: {
      create: {
        after: async (created) => {
          await dropUnprovenPassword(created.userId, created.providerId);
        },
      },
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
});
