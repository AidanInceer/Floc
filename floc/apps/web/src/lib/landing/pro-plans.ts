import { BILLING_INTERVALS, INTERVAL_MONTHS, type BillingInterval } from "@floc/core/billing/plans";
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

const WORDS: Record<BillingInterval, { label: string; per: string }> = {
  monthly: { label: "Month", per: "a month" },
  quarterly: { label: "3 months", per: "every 3 months" },
  yearly: { label: "Year", per: "a year" },
};

/** Over a whole year, so every period's saving reads on the same terms ("Save £11.92 on the year"). */
function savingMinor(price: PlanPrice, monthly: PlanPrice | undefined): number {
  if (!monthly || monthly.currency !== price.currency) return 0;
  return monthly.amountMinor * 12 - price.amountMinor * (12 / INTERVAL_MONTHS[price.interval]);
}

/** The periods Stripe has, month first. A saving is exact against paying monthly (design card: money is exact). */
export function proPlans(prices: PlanPrice[]): { plans: ProPlan[]; initial: BillingInterval | null } {
  const byInterval = new Map(prices.map((p) => [p.interval, p]));
  const monthly = byInterval.get("monthly");
  const priced = BILLING_INTERVALS.flatMap((interval) => {
    const price = byInterval.get(interval);
    return price ? [{ interval, price, save: savingMinor(price, monthly) }] : [];
  });
  const most = Math.max(0, ...priced.map((p) => p.save));
  const plans = priced.map(({ interval, price, save }) => ({
    interval,
    label: WORDS[interval].label,
    price: formatMoney(price.amountMinor, price.currency),
    per: WORDS[interval].per,
    saving: save > 0 ? formatMoney(save, price.currency) : null,
    best: save > 0 && save === most,
  }));
  const initial = plans.find((p) => p.best)?.interval ?? plans[0]?.interval ?? null;
  return { plans, initial };
}
