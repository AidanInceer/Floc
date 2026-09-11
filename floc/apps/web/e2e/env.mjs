import { resolve } from "node:path";

export const WEB_DIR = resolve(import.meta.dirname, "..");
export const DATA_DIR = resolve(WEB_DIR, ".e2e/data");

/**
 * Its own database, uploads and port, so a run never touches `local.db` or
 * the dev server on 3000. Blank third-party keys stop Next filling them from
 * `.env`: a test must never send mail or reach Stripe.
 */
export function e2eEnv(port) {
  return {
    TURSO_DATABASE_URL: "file:./.e2e/data/e2e.db",
    BETTER_AUTH_SECRET: "e2e-only-not-a-real-secret-q7Rk2Vx9Lm4Tz8Wp",
    BETTER_AUTH_URL: `http://localhost:${port}`,
    FLOC_FILES_DIR: ".e2e/data/files",
    FLOC_DEV_USER_EMAIL: "you@e2e.floc.test",
    FLOC_DEV_USER_PASSWORD: "e2e-password-1",
    FLOC_DEV_USER_NAME: "E2E you",
    FLOC_LAN_ORIGIN: "",
    FLOC_NEXT_DIST_DIR: process.env.FLOC_NEXT_DIST_DIR ?? ".next-verify",
    GOOGLE_CLIENT_ID: "",
    GOOGLE_CLIENT_SECRET: "",
    RESEND_API_KEY: "",
    STRIPE_SECRET_KEY: "",
    STRIPE_WEBHOOK_SECRET: "",
  };
}
