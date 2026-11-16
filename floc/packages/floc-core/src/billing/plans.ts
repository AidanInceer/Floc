export const PLANS = ["free", "pro"] as const;
export type Plan = (typeof PLANS)[number];

export type Scope = "trip" | "user";

export const FEATURE_PLAN = {
  "dates.weather": { plan: "pro", scope: "trip" },
  "packing.autoGenerate": { plan: "pro", scope: "trip" },
  "booking.prefill": { plan: "pro", scope: "trip" },
  "files.extraStorage": { plan: "pro", scope: "trip" },
  "bookings.autoFile": { plan: "pro", scope: "user" },
  "money.estimate": { plan: "pro", scope: "user" },
} as const satisfies Record<string, { plan: Plan; scope: Scope }>;

export type FeatureKey = keyof typeof FEATURE_PLAN;

export type TargetOf<K extends FeatureKey> =
  (typeof FEATURE_PLAN)[K]["scope"] extends "trip" ? number : string;

export function planMeets(held: Plan, required: Plan): boolean {
  return PLANS.indexOf(held) >= PLANS.indexOf(required);
}

export const BILLING_INTERVALS = ["monthly", "yearly"] as const;
export type BillingInterval = (typeof BILLING_INTERVALS)[number];
