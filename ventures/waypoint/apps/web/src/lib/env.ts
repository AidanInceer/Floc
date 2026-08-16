/**
 * Environment variables that have no honest degraded mode (ticket 112). Rule
 * 11 (degrade, don't crash) covers optional third-party credentials
 * (Nominatim, Resend, Google), which have real fallbacks. A session secret
 * and the primary datastore don't: missing `BETTER_AUTH_SECRET` would sign
 * cookies with a constant from this repo, and missing `TURSO_DATABASE_URL`
 * would serve an empty ephemeral db as silent data loss. Failing loudly here
 * is the correct reading of rule 11, not an exception to it.
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
 * The variable's value, or `devFallback` outside production. Missing/blank in
 * production throws at module load, so the deploy fails rather than the first
 * user. Error message names the variable, never the value.
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
 * The app's own origin. Not a secret, but same shape of problem: missing
 * `BETTER_AUTH_URL` would send OAuth callbacks and invite links to
 * `localhost` silently. A function, not a constant, so importing this module
 * never throws for a caller that only wants `requireInProduction`.
 */
export function appUrl(): string {
  return requireInProduction("BETTER_AUTH_URL", "http://localhost:3000");
}
