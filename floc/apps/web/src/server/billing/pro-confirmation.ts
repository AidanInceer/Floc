/**
 * The email that confirms a Stripe Pro purchase (#523). It repeats the 14-day consent the buyer
 * ticked at checkout, on a durable medium, as CCR 2013 reg 37 asks. Stripe redelivers events, so
 * the subscription's own metadata marks it sent.
 */
import "server-only";

import type Stripe from "stripe";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { user } from "@/db/schema";
import { absoluteUrl, sendEmails, type OutboundEmail } from "@/server/auth/email";
import { intervalOfPrice } from "@/server/billing/billing";
import { formatDate, toIsoDate } from "@floc/core/dates/dates";
import { planOffer } from "@floc/core/billing/plan-offer";
import type { Currency } from "@floc/core/money/currency";

type Send = (batch: OutboundEmail[]) => Promise<void>;

export async function confirmProStarted(
  api: Stripe,
  userId: string,
  sub: Stripe.Subscription,
  send: Send = sendEmails,
): Promise<void> {
  if (sub.metadata?.confirmationSentAt) return;

  const buyer = await db.select({ email: user.email }).from(user).where(eq(user.id, userId)).get();
  if (!buyer) return;

  await send([proStartedEmail(buyer.email, sub)]);
  await api.subscriptions.update(sub.id, { metadata: { confirmationSentAt: new Date().toISOString() } });
}

function proStartedEmail(to: string, sub: Stripe.Subscription): OutboundEmail {
  const day = (d: Date) => formatDate(toIsoDate(d), { weekday: false, year: true });
  const consentAt = sub.metadata?.startNowConsentAt;

  return {
    to,
    subject: "You're on Floc Pro",
    lines: [
      `Thank you. Floc Pro is yours${planWords(sub)}, and it renews until you cancel.`,
      ...(consentAt
        ? [`On ${day(new Date(consentAt))} you asked for Pro to start straight away, and agreed that you lose your 14-day right to cancel once it starts.`]
        : []),
      "You can stop it renewing at any time in Settings. Pro then runs to the end of the period you have paid for.",
      "Pro is yours alone. Everyone else on your trips keeps what they have.",
    ],
    cta: { label: "Open Settings", url: absoluteUrl("/settings?section=billing") },
  };
}

/** ": £8.99 every 3 months", or nothing when the Price is not one Floc names. */
function planWords(sub: Stripe.Subscription): string {
  const price = sub.items?.data?.[0]?.price;
  const interval = price ? intervalOfPrice(price.id) : null;
  if (!price || price.unit_amount === null || !interval) return "";

  const offer = planOffer(
    { interval, amountMinor: price.unit_amount, currency: price.currency.toUpperCase() as Currency },
    null,
  );
  return `: ${offer.charge} ${offer.per}`;
}
