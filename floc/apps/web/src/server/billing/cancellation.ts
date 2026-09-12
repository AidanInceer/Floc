import type Stripe from "stripe";

// Why: flexible billing mode portal cancels set `cancel_at` and leave
// `cancel_at_period_end` false, so reading only the flag says "renews".
export function endsWithoutRenewing(
  sub: Pick<Stripe.Subscription, "cancel_at_period_end" | "cancel_at">,
): boolean {
  return sub.cancel_at_period_end || sub.cancel_at !== null;
}
