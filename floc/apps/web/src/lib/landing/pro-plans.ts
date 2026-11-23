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
  savingOn: string;
  best: boolean;
};

const WORDS: Record<BillingInterval, { label: string; per: string; months: number; savingOn: string }> = {
  monthly: { label: "Month", per: "a month", months: 1, savingOn: "" },
  quarterly: { label: "3 months", per: "every 3 months", months: 3, savingOn: "on 3 months" },
  yearly: { label: "Year", per: "a year", months: 12, savingOn: "on the year" },
};

function savingMinor(price: PlanPrice, monthly: PlanPrice | undefined): number {
  if (!monthly || monthly.currency !== price.currency) return 0;
  return monthly.amountMinor * WORDS[price.interval].months - price.amountMinor;
}

export function proPlans(prices: PlanPrice[]): { plans: ProPlan[]; initial: BillingInterval | null } {
  const byInterval = new Map(prices.map((p) => [p.interval, p]));
  const monthly = byInterval.get("monthly");
  const offers = BILLING_INTERVALS.flatMap((interval) => {
    const price = byInterval.get(interval);
    return price ? [{ price, save: savingMinor(price, monthly) }] : [];
  });
  const shareSaved = ({ price, save }: (typeof offers)[number]) => save / (price.amountMinor + save);
  const top = offers.filter((o) => o.save > 0).sort((a, b) => shareSaved(b) - shareSaved(a))[0];
  const plans = offers.map((offer) => {
    const { price, save } = offer;
    const words = WORDS[price.interval];
    return {
      interval: price.interval,
      label: words.label,
      price: formatMoney(price.amountMinor, price.currency),
      per: words.per,
      saving: save > 0 ? formatMoney(save, price.currency) : null,
      savingOn: words.savingOn,
      best: offer === top,
    };
  });
  return { plans, initial: top?.price.interval ?? plans[0]?.interval ?? null };
}
