/**
 * What a checkout click must carry (#523): a plan Floc sells, and the 14-day consent ticked — the
 * buyer asks for Pro to start now and accepts losing the right to cancel once it does (CCR 2013
 * reg 37). The time of the tick goes on the Stripe subscription as the record.
 */
import { BILLING_INTERVALS, type BillingInterval } from "@floc/core/billing/plans";

export type CheckoutRequest = { interval: BillingInterval; consentAt: Date };

export function readCheckoutRequest(body: unknown, now = new Date()): CheckoutRequest | { refusal: string } {
  const fields = typeof body === "object" && body ? (body as Record<string, unknown>) : {};
  const interval = BILLING_INTERVALS.find((i) => i === fields.interval);
  if (!interval) return { refusal: "Pick a plan." };
  if (fields.consent !== "yes") return { refusal: "Tick the box to start Pro straight away." };
  return { interval, consentAt: now };
}
