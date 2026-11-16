function isProduction(): boolean {
  return (
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PHASE !== "phase-production-build"
  );
}

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

export function appUrl(): string {
  return requireInProduction("BETTER_AUTH_URL", "http://localhost:3000");
}

export function allFeaturesFree(): boolean {
  return process.env.NEXT_PUBLIC_ALL_FEATURES_FREE === "true";
}
