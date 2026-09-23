/**
 * Why: rule 11 (degrade, don't crash) covers optional third-party credentials, which have
 * fallbacks. A session secret and the primary datastore don't — a missing `BETTER_AUTH_SECRET`
 * would sign cookies with a repo constant, a missing `TURSO_DATABASE_URL` would serve an empty
 * ephemeral db as silent data loss. Failing loudly is rule 11, not an exception to it (#112).
 */

// Why: `next build` sets NODE_ENV=production while collecting page data, but CI has no secrets.
function isProduction(): boolean {
  return (
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PHASE !== "phase-production-build"
  );
}

// Why: throws at module load, so a missing variable fails the deploy rather than the first user.
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

// Why: a function, not a constant, so importing this module never throws for a caller that only
// wants `requireInProduction`. Missing `BETTER_AUTH_URL` would silently point invites at localhost.
export function appUrl(): string {
  return requireInProduction("BETTER_AUTH_URL", "http://localhost:3000");
}

/**
 * Why: kill switch for the paid tier — every gate answers yes and no Pro surface is drawn. Set it
 * while Pro cannot be bought, or the gates would take weather and packing auto-fill from everyone.
 * `NEXT_PUBLIC_` so a client component can read it instead of threading a boolean down every tree.
 */
export function allFeaturesFree(): boolean {
  return process.env.NEXT_PUBLIC_ALL_FEATURES_FREE === "true";
}
