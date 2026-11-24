export const PLANS = ["free", "pro"] as const;
export type Plan = (typeof PLANS)[number];

export const FEATURE_PLAN = {
  "dates.weather": { plan: "pro" },
  "packing.autoGenerate": { plan: "pro" },
  "files.extraStorage": { plan: "pro" },
  "bookings.autoFile": { plan: "pro" },
  "money.estimate": { plan: "pro" },
} as const satisfies Record<string, { plan: Plan }>;

export type FeatureKey = keyof typeof FEATURE_PLAN;

export function planMeets(held: Plan, required: Plan): boolean {
  return PLANS.indexOf(held) >= PLANS.indexOf(required);
}

export const BILLING_INTERVALS = ["monthly", "quarterly", "yearly"] as const;
export type BillingInterval = (typeof BILLING_INTERVALS)[number];
