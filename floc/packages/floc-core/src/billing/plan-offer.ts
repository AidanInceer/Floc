/**
 * What one Pro plan says on a price button (#523), the same words on web and phone: the real
 * charge first, then a small per-month figure and the exact saving a year against monthly.
 * Pure, so the arithmetic is tested without Stripe or a store.
 */
import { formatMoney } from "../money/money";
import type { Currency } from "../money/currency";
import { INTERVAL_MONTHS, type BillingInterval } from "./plans";

export type PlanPrice = { interval: BillingInterval; amountMinor: number; currency: Currency };

export type PlanOffer = {
  label: string;
  charge: string;
  per: string;
  perMonth: string | null;
  saving: string | null;
};

// Why: "Every 3 months", never "quarterly" — the ticket's word for the plain reading (#523).
const WORDS: Record<BillingInterval, { label: string; per: string }> = {
  monthly: { label: "Monthly", per: "a month" },
  quarterly: { label: "Every 3 months", per: "every 3 months" },
  yearly: { label: "Yearly", per: "a year" },
};

export function planOffer(price: PlanPrice, monthlyMinor: number | null): PlanOffer {
  const months = INTERVAL_MONTHS[price.interval];
  const money = (minor: number) => formatMoney(minor, price.currency);
  const saved = monthlyMinor === null ? 0 : monthlyMinor * 12 - price.amountMinor * (12 / months);

  return {
    ...WORDS[price.interval],
    charge: money(price.amountMinor),
    perMonth: months > 1 ? `${money(Math.round(price.amountMinor / months))} a month` : null,
    saving: months > 1 && saved > 0 ? `Save ${money(Math.round(saved))} a year` : null,
  };
}
