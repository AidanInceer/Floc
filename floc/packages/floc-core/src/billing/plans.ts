/**
 * Why: the lock a component draws and the check a Server Action runs must agree, so both read
 * this one pure, client-safe file. `Plan`, not `Tier` — `PACK_TIERS` already means the pack
 * levels (#246).
 */

export const PLANS = ["free", "pro"] as const;
export type Plan = (typeof PLANS)[number];

/**
 * Why: dotted keys put granularity below the page — Dates stays free while `dates.weather` is
 * Pro. A key exists only once something gates on it; a gate that can never answer no is code
 * with no behaviour. Every key answers for one person: Pro follows the buyer, never their trip
 * (ADR-012, #523).
 */
export const FEATURE_PLAN = {
  "dates.weather": "pro",
  "packing.autoGenerate": "pro",
  "booking.prefill": "pro",
  "files.extraStorage": "pro",
} as const satisfies Record<string, Plan>;

export type FeatureKey = keyof typeof FEATURE_PLAN;

/** Ordered weakest first, so "does this plan reach that one" is a comparison. */
export function planMeets(held: Plan, required: Plan): boolean {
  return PLANS.indexOf(held) >= PLANS.indexOf(required);
}

// Why: here rather than with Stripe, so the browser can name an interval without pulling the
// server in behind it.
export const BILLING_INTERVALS = ["monthly", "quarterly", "yearly"] as const;
export type BillingInterval = (typeof BILLING_INTERVALS)[number];

/** How long one charge buys: same features on every period, only the length differs (#523). */
export const INTERVAL_MONTHS: Record<BillingInterval, number> = { monthly: 1, quarterly: 3, yearly: 12 };
