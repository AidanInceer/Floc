/**
 * Stripe, and the local record it writes (ticket 246). Written against
 * Stripe's own SDK rather than the Better Auth Stripe plugin: the plugin owns
 * tables outside our schema, which fights the migration-drift check, and its
 * injected routes sit badly with the layering and dead-code checks.
 *
 * Rule 11 throughout — with no keys set, `stripe()` is null, `PRICES` is
 * empty, and Pro simply never sells. Nothing here crashes a page; the gate in
 * ./entitlements.ts reads the local table, which stays empty.
 */
import "server-only";

import { and, desc, eq, isNull } from "drizzle-orm";
import Stripe from "stripe";
import { cache } from "react";

import { db } from "@/db";
import { subscription } from "@/db/schema";
import type { Subscription, SubscriptionStatus } from "@/db/schema";
import type { Currency } from "@floc/core/money/currency";
import { BILLING_INTERVALS, type BillingInterval } from "@floc/core/billing/plans";

export { BILLING_INTERVALS, type BillingInterval };


let client: Stripe | null | undefined;

/** Null when unconfigured, so callers degrade rather than throw at import. */
export function stripe(): Stripe | null {
  if (client === undefined) {
    const key = process.env.STRIPE_SECRET_KEY;
    client = key ? new Stripe(key) : null;
  }
  return client;
}

/**
 * Price *ids*, never amounts. Stripe owns the £3.99/£29.99, so a price change
 * is a dashboard edit rather than a deploy — and no money figure ever lands
 * in this repo.
 */
export function priceFor(interval: BillingInterval): string | undefined {
  return interval === "monthly"
    ? process.env.STRIPE_PRICE_MONTHLY
    : process.env.STRIPE_PRICE_YEARLY;
}

/**
 * The Stripe customer for this account, reusing the one a previous
 * subscription recorded. `metadata.userId` is the thread back to us for
 * `customer.subscription.*` events, which name a customer and not a session.
 */
export async function customerFor(user: {
  id: string;
  email: string;
  name: string;
}): Promise<string> {
  const api = stripe();
  if (!api) throw new Error("Stripe is not configured");

  const existing = await db
    .select({ customerId: subscription.stripeCustomerId })
    .from(subscription)
    .where(eq(subscription.userId, user.id))
    .get();

  if (existing?.customerId) return existing.customerId;

  const created = await api.customers.create({
    email: user.email,
    name: user.name,
    metadata: { userId: user.id },
  });

  return created.id;
}

/**
 * Writes what Stripe just told us. Keyed on the Stripe subscription id, which
 * is unique in the schema, so a redelivered event overwrites rather than
 * inserting a second row — Stripe retries any non-2xx, so duplicate delivery
 * is ordinary traffic.
 */
export async function recordSubscription(args: {
  userId: string;
  sub: Stripe.Subscription;
}): Promise<void> {
  const { userId, sub } = args;
  const periodEnd = periodEndOf(sub);

  const values = {
    userId,
    plan: "pro" as const,
    status: sub.status as SubscriptionStatus,
    source: "stripe" as const,
    stripeCustomerId:
      typeof sub.customer === "string" ? sub.customer : sub.customer.id,
    stripeSubscriptionId: sub.id,
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
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

/**
 * The period end lives on the items in current Stripe API versions and on the
 * subscription itself in older ones. Read both rather than pin a version and
 * have renewals silently stop extending.
 */
function periodEndOf(sub: Stripe.Subscription): Date | null {
  const fromItem = sub.items?.data?.[0]?.current_period_end;
  const fromSub = (sub as unknown as { current_period_end?: number })
    .current_period_end;
  const seconds = fromItem ?? fromSub;
  return seconds ? new Date(seconds * 1000) : null;
}

/**
 * What Pro costs, asked of Stripe rather than written down (ticket 250).
 * Stripe owns the figures, so a price change is a dashboard edit and no
 * amount ever lands in this repo. Empty when unconfigured or unreachable —
 * the page then sells Pro without quoting a price rather than breaking.
 */
export type ProPrice = {
  interval: BillingInterval;
  amountMinor: number;
  currency: Currency;
};

export const proPrices = cache(async function proPrices(): Promise<ProPrice[]> {
  const api = stripe();
  if (!api) return [];

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
        console.warn("[billing] could not read a price — selling without one");
        return null;
      }
    }),
  );

  return rows.filter((r): r is ProPrice => r !== null);
});

/**
 * The account's own subscription row, or null (ticket 247). Newest first, so
 * an account that resubscribed after lapsing shows the current arrangement
 * rather than the dead one.
 */
export const subscriptionOf = cache(async function subscriptionOf(
  userId: string,
): Promise<Subscription | null> {
  const row = await db
    .select()
    .from(subscription)
    .where(and(eq(subscription.userId, userId), isNull(subscription.deletedAt)))
    .orderBy(desc(subscription.id))
    .get();

  return row ?? null;
});

/**
 * A one-off link into Stripe's hosted billing portal (ticket 247). Hosted
 * rather than built: cancelling, swapping card and reading invoices all live
 * behind it, and card details never touch Floc.
 */
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

/** Who a `customer.subscription.*` event belongs to. */
export async function userIdForCustomer(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer,
): Promise<string | null> {
  const id = typeof customer === "string" ? customer : customer.id;

  const known = await db
    .select({ userId: subscription.userId })
    .from(subscription)
    .where(eq(subscription.stripeCustomerId, id))
    .get();

  if (known) return known.userId;

  const api = stripe();
  if (!api) return null;

  const row = await api.customers.retrieve(id);
  if (row.deleted) return null;
  return row.metadata?.userId ?? null;
}
