export const SEED_DOMAIN = "seed.floc.test";

export const SCENARIOS = ["a", "b"] as const;
export type Scenario = (typeof SCENARIOS)[number];

export function seedEmail(handle: string, scenario: Scenario): string {
  return `${handle}@${scenario}.${SEED_DOMAIN}`;
}

export const SEED_PASSWORD = "seed-password";

export function isSeedEmail(email: string): boolean {
  return email.toLowerCase().endsWith(`.${SEED_DOMAIN}`);
}
