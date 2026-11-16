import "server-only";

import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { anonymous, bearer } from "better-auth/plugins";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { requireInProduction } from "@/lib/env";
import { dropUnprovenPassword } from "@/server/auth/link-guard";
import { accountMail } from "@/server/auth/mail/mail-cap";

const googleConfigured =
  !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;

export const enabledProviders = {
  google: googleConfigured,
  facebook: false,
} as const;

const MOBILE_SCHEME = process.env.FLOC_MOBILE_SCHEME ?? "floc";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  plugins: [
    bearer(),
    expo(),
    anonymous({
      emailDomainName: "guest.floc.invalid",
      async onLinkAccount({ anonymousUser, newUser }) {
        const { adoptGuest } = await import("@/server/guests/guest-adopt");
        await adoptGuest(anonymousUser.user.id, newUser.user.id);
      },
    }),
    nextCookies(),
  ],
  disabledPaths: ["/sign-in/anonymous"],
  trustedOrigins: [
    `${MOBILE_SCHEME}://`,
    ...(process.env.FLOC_LAN_ORIGIN ? [process.env.FLOC_LAN_ORIGIN] : []),
  ],
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
    requireEmailVerification: false,
    revokeSessionsOnPasswordReset: true,
    resetPasswordTokenExpiresIn: 60 * 60,
    async sendResetPassword({ user, url }) {
      if (!accountMail.allow("reset", user.email)) return;
      const { sendEmails, emails } = await import("@/server/auth/email");
      await sendEmails([emails.resetPassword({ to: user.email, url })]);
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    expiresIn: 60 * 60,
    async sendVerificationEmail({ user, url }) {
      if (!accountMail.allow("verify", user.email)) return;
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
    encryptOAuthTokens: true,
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
      requireLocalEmailVerified: false,
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (created) => {
          if ((created as { isAnonymous?: boolean | null }).isAnonymous) return;
          const { recordTermsAcceptance } = await import("@/server/legal/terms-acceptance");
          await recordTermsAcceptance(created.id);
        },
      },
    },
    account: {
      create: {
        after: async (created) => {
          await dropUnprovenPassword(created.userId, created.providerId);
        },
      },
    },
  },
  rateLimit: {
    customRules: {
      "/sign-up/email": { window: 60 * 60, max: 10 },
      "/request-password-reset": { window: 60 * 60, max: 5 },
      "/send-verification-email": { window: 60 * 60, max: 5 },
    },
  },
  advanced: {
    ipAddress: { ipAddressHeaders: ["x-real-ip"] },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 60,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
});
