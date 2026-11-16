import type Stripe from "stripe";

export function endsWithoutRenewing(
  sub: Pick<Stripe.Subscription, "cancel_at_period_end" | "cancel_at">,
): boolean {
  return sub.cancel_at_period_end || sub.cancel_at !== null;
}
