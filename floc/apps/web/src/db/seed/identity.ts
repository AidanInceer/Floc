/**
 * Who the seed invents, and how to tell them from real people (#no-ticket).
 *
 * Everything the seed writes hangs off a person, and every seeded person's
 * email ends in this domain — which is what makes `--reset` exact rather than
 * a guess. `.test` is reserved by RFC 2606, so no live inbox can ever collide.
 *
 * Pure and import-free on purpose: the seed script (plain Node) and the
 * dev sign-in route (Next) both read it, and neither can pull the other's
 * runtime in.
 */
export const SEED_DOMAIN = "seed.floc.test";

/** One scenario per suffix, so resetting one leaves the other standing. */
export const SCENARIOS = ["a", "b"] as const;
export type Scenario = (typeof SCENARIOS)[number];

/** `priya@a.seed.floc.test` — the scenario is in the address, not a column. */
export function seedEmail(handle: string, scenario: Scenario): string {
  return `${handle}@${scenario}.${SEED_DOMAIN}`;
}

/**
 * The same password for every seeded person, so the sign-in picker can offer
 * any of them without holding a list of secrets. Safe only because these
 * accounts exist on a local file database and the door that uses them is shut
 * outside development — see `devSignInEnabled`.
 */
export const SEED_PASSWORD = "seed-password";

/** True for anyone the seed made. The gate on signing in as somebody else. */
export function isSeedEmail(email: string): boolean {
  return email.toLowerCase().endsWith(`.${SEED_DOMAIN}`);
}
