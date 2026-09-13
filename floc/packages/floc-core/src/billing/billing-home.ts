/**
 * Where a subscription can be changed or cancelled. Apple and Google refuse to
 * let an app cancel their subscriptions for you, and Stripe's portal is a web
 * page — so each surface draws only the way out that works where you are.
 */
export type BillingHome = "web" | "app_store" | "play" | "none";

export function billingHome(source: string): BillingHome {
  if (source === "app_store" || source === "play") return source;
  if (source === "stripe") return "web";
  return "none";
}
