import { BILLING_INTERVALS, type BillingInterval } from "@floc/core/billing/plans";
import type { Currency } from "@floc/core/money/currency";
import { formatMoney } from "@floc/core/money/money";

export type PlanPrice = { interval: BillingInterval; amountMinor: number; currency: Currency };

export type ProPlan = {
  interval: BillingInterval;
  label: string;
  price: string;
  per: string;
  saving: string | null;
  best: boolean;
};

const WORDS: Record<BillingInterval, { label: string; per: string; months: number }> = {
  monthly: { label: "Month", per: "a month", months: 1 },
  yearly: { label: "Year", per: "a year", months: 12 },
};

function savingMinor(price: PlanPrice, monthly: PlanPrice | undefined): number {
  if (!monthly || monthly.currency !== price.currency) return 0;
  return monthly.amountMinor * WORDS[price.interval].months - price.amountMinor;
}

/** The periods Stripe has, month first. A saving is exact against paying monthly (design card: money is exact). */
export function proPlans(prices: PlanPrice[]): { plans: ProPlan[]; initial: BillingInterval | null } {
  const byInterval = new Map(prices.map((p) => [p.interval, p]));
  const monthly = byInterval.get("monthly");
  const plans = BILLING_INTERVALS.flatMap((interval) => {
    const price = byInterval.get(interval);
    if (!price) return [];
    const save = savingMinor(price, monthly);
    return [{
      interval,
      label: WORDS[interval].label,
      price: formatMoney(price.amountMinor, price.currency),
      per: WORDS[interval].per,
      saving: save > 0 ? formatMoney(save, price.currency) : null,
      best: save > 0,
    }];
  });
  const initial = plans.find((p) => p.best)?.interval ?? plans[0]?.interval ?? null;
  return { plans, initial };
}
