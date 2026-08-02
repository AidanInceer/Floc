/**
 * Environment variables that have no honest degraded mode (ticket 112).
 *
 * Non-negotiable 11 — degrade, don't crash — is about *optional third-party*
 * credentials: Nominatim, Resend, Google. Each of those has a real fallback
 * (free-text place names, console-logged email, no Google button). A session
 * signing secret and the primary datastore have none: a production deploy
 * missing `BETTER_AUTH_SECRET` would boot happily and sign every session cookie
 * with a constant that lives in this repo, and one missing
 * `TURSO_DATABASE_URL` would serve an empty ephemeral file database that reads
 * as total data loss. Failing loudly is the correct reading of rule 11 here,
 * not an exception to it.
 */

/**
 * True only for a real production runtime. `next build` runs with NODE_ENV set
 * to production while collecting page data, but CI has no deployment secrets.
 */
function isProduction(): boolean {
  return (
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PHASE !== "phase-production-build"
  );
}

/**
 * The variable's value, or `devFallback` outside production. In production a
 * missing or blank value throws at *module load*, so the deploy fails rather
 * than the first user.
 *
 * The message names the variable and never the value — nothing here may end up
 * in a log line carrying a secret.
 */
export function requireInProduction(name: string, devFallback: string): string {
  const value = process.env[name];
  if (value) return value;

  if (isProduction()) {
    throw new Error(
      `${name} is not set. It has no safe default in production — set it on the deployment and redeploy.`,
    );
  }

  return devFallback;
}

/**
 * The app's own origin. Not a secret, but the same shape of problem: a
 * production deploy without `BETTER_AUTH_URL` sends OAuth callbacks and
 * *emailed invite links* to `localhost`, which fails silently in the recipient's
 * inbox rather than at deploy time.
 *
 * A function, not a module constant, so importing this module never throws for
 * a caller that only wants `requireInProduction`.
 */
export function appUrl(): string {
  return requireInProduction("BETTER_AUTH_URL", "http://localhost:3000");
}
