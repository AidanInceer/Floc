/**
 * Why: the lock a component draws and the check a Server Action runs must agree, so both read
 * this one pure, client-safe file. `Plan`, not `Tier` — `PACK_TIERS` already means the pack
 * levels (#246).
 */

export const PLANS = ["free", "pro"] as const;
export type Plan = (typeof PLANS)[number];

// Why: typed, not conventional, so a `"trip"` feature cannot compile without a trip id — some
// surfaces really are user-scoped (a saved packing list is yours, not a trip's).
export type Scope = "trip" | "user";

/**
 * Why: dotted keys put granularity below the page — Dates stays free while `dates.weather` is
 * Pro. A key exists only once something gates on it; a gate that can never answer no is code
 * with no behaviour.
 */
export const FEATURE_PLAN = {
  "dates.weather": { plan: "pro", scope: "trip" },
  "packing.autoGenerate": { plan: "pro", scope: "trip" },
  "booking.prefill": { plan: "pro", scope: "trip" },
  "files.extraStorage": { plan: "pro", scope: "trip" },
} as const satisfies Record<string, { plan: Plan; scope: Scope }>;

export type FeatureKey = keyof typeof FEATURE_PLAN;

/** Whose plan answers this feature: a trip's members, or one account. */
export type TargetOf<K extends FeatureKey> =
  (typeof FEATURE_PLAN)[K]["scope"] extends "trip" ? number : string;

/** Ordered weakest first, so "does this plan reach that one" is a comparison. */
export function planMeets(held: Plan, required: Plan): boolean {
  return PLANS.indexOf(held) >= PLANS.indexOf(required);
}

// Why: here rather than with Stripe, so the browser can name an interval without pulling the
// server in behind it.
export const BILLING_INTERVALS = ["monthly", "yearly"] as const;
export type BillingInterval = (typeof BILLING_INTERVALS)[number];
