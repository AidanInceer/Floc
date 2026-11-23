import "server-only";

import { and, desc, eq, isNull } from "drizzle-orm";
import Stripe from "stripe";
import { cache } from "react";

import { db } from "@/db";
import { billingCustomer, subscription } from "@/db/schema";
import type { Subscription, SubscriptionStatus } from "@/db/schema";
import type { Currency } from "@floc/core/money/currency";
import { BILLING_INTERVALS, type BillingInterval } from "@floc/core/billing/plans";
import { isLive } from "@floc/core/billing/subscription-copy";

import { log } from "@/server/observability/log";

import { endsWithoutRenewing } from "./cancellation";

export { BILLING_INTERVALS, type BillingInterval };


let client: Stripe | null | undefined;

export function stripe(): Stripe | null {
  if (client === undefined) {
    const key = process.env.STRIPE_SECRET_KEY;
    client = key ? new Stripe(key) : null;
  }
  return client;
}

export function priceFor(interval: BillingInterval): string | undefined {
  return interval === "monthly"
    ? process.env.STRIPE_PRICE_MONTHLY
    : process.env.STRIPE_PRICE_YEARLY;
}

export async function customerFor(user: {
  id: string;
  email: string;
  name: string;
}): Promise<string> {
  const api = stripe();
  if (!api) throw new Error("Stripe is not configured");

  const existing = await customerIdOf(user.id);
  if (existing) return existing;

  const created = await api.customers.create({
    email: user.email,
    name: user.name,
    metadata: { userId: user.id },
  });

  await keepCustomer(user.id, created.id);
  return (await customerIdOf(user.id)) ?? created.id;
}

export async function customerIdOf(userId: string): Promise<string | null> {
  const row = await db
    .select({ customerId: billingCustomer.stripeCustomerId })
    .from(billingCustomer)
    .where(and(eq(billingCustomer.userId, userId), isNull(billingCustomer.deletedAt)))
    .get();
  return row?.customerId ?? null;
}

async function keepCustomer(userId: string, customerId: string): Promise<void> {
  await db.insert(billingCustomer).values({ userId, stripeCustomerId: customerId }).onConflictDoNothing();
  const kept = await customerIdOf(userId);
  if (kept !== customerId) log.warn("billing.second-customer");
}

export async function recordSubscription(args: {
  userId: string;
  sub: Stripe.Subscription;
}): Promise<void> {
  const { userId, sub } = args;
  const periodEnd = periodEndOf(sub);

  await keepCustomer(userId, typeof sub.customer === "string" ? sub.customer : sub.customer.id);

  const values = {
    userId,
    plan: "pro" as const,
    status: sub.status as SubscriptionStatus,
    source: "stripe" as const,
    stripeSubscriptionId: sub.id,
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: endsWithoutRenewing(sub),
    lastModifiedAt: new Date(),
  };

  await db
    .insert(subscription)
    .values(values)
    .onConflictDoUpdate({
      target: subscription.stripeSubscriptionId,
      set: values,
    });
}

function periodEndOf(sub: Stripe.Subscription): Date | null {
  const fromItem = sub.items?.data?.[0]?.current_period_end;
  const fromSub = (sub as unknown as { current_period_end?: number })
    .current_period_end;
  const seconds = fromItem ?? fromSub;
  return seconds ? new Date(seconds * 1000) : null;
}

export type ProPrice = {
  interval: BillingInterval;
  amountMinor: number;
  currency: Currency;
};

const PRICES_KEEP_MS = 6 * 60 * 60 * 1000;

let pricesMemo: { at: number; prices: ProPrice[] } | null = null;

export const proPrices = cache(async function proPrices(): Promise<ProPrice[]> {
  if (pricesMemo && Date.now() - pricesMemo.at < PRICES_KEEP_MS) return pricesMemo.prices;
  const prices = await readProPrices();
  if (prices.complete) pricesMemo = { at: Date.now(), prices: prices.rows };
  return prices.rows;
});

async function readProPrices(): Promise<{ rows: ProPrice[]; complete: boolean }> {
  const api = stripe();
  if (!api) return { rows: [], complete: false };

  const wanted = BILLING_INTERVALS.map(
    (interval) => [interval, priceFor(interval)] as const,
  ).filter((pair): pair is [BillingInterval, string] => Boolean(pair[1]));

  const rows = await Promise.all(
    wanted.map(async ([interval, id]) => {
      try {
        const price = await api.prices.retrieve(id);
        return price.unit_amount === null
          ? null
          : {
              interval,
              amountMinor: price.unit_amount,
              currency: price.currency.toUpperCase() as Currency,
            };
      } catch {
        log.warn("billing.price-unreadable");
        return null;
      }
    }),
  );

  const read = rows.filter((r): r is ProPrice => r !== null);
  return { rows: read, complete: read.length === wanted.length };
}

export const subscriptionOf = cache(async function subscriptionOf(
  userId: string,
): Promise<Subscription | null> {
  const rows = await db
    .select()
    .from(subscription)
    .where(and(eq(subscription.userId, userId), isNull(subscription.deletedAt)))
    .orderBy(desc(subscription.id))
    .all();

  return rows.find((row) => isLive(row)) ?? rows[0] ?? null;
});

export async function portalUrlFor(args: {
  customerId: string;
  returnUrl: string;
}): Promise<string | null> {
  const api = stripe();
  if (!api) return null;

  const session = await api.billingPortal.sessions.create({
    customer: args.customerId,
    return_url: args.returnUrl,
  });

  return session.url;
}

export async function userIdForCustomer(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer,
): Promise<string | null> {
  const id = typeof customer === "string" ? customer : customer.id;

  const known = await db
    .select({ userId: billingCustomer.userId })
    .from(billingCustomer)
    .where(and(eq(billingCustomer.stripeCustomerId, id), isNull(billingCustomer.deletedAt)))
    .get();

  if (known) return known.userId;

  const api = stripe();
  if (!api) return null;

  const row = await api.customers.retrieve(id);
  if (row.deleted) return null;
  return row.metadata?.userId ?? null;
}
