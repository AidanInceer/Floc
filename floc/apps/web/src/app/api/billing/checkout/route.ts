/**
 * Starts a Stripe Checkout session and hands back its URL (ticket 246).
 * A hosted Stripe page, not a payment link: a link cannot say which logged-in
 * account paid, so the webhook would have nothing to attach the subscription
 * to.
 */
import { headers } from "next/headers";

import { appUrl } from "@/lib/env";
import { auth } from "@/server/auth";
import {
  BILLING_INTERVALS,
  customerFor,
  priceFor,
  stripe,
  type BillingInterval,
} from "@/server/billing";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const api = stripe();
  if (!api) return refuse(503, "Billing is not configured");

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return refuse(401, "Sign in first");

  const interval = await readInterval(request);
  if (!interval) return refuse(400, "Pick monthly or yearly");

  const price = priceFor(interval);
  if (!price) return refuse(503, "That price is not configured");

  const customer = await customerFor({
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
  });

  const checkout = await api.checkout.sessions.create({
    mode: "subscription",
    customer,
    line_items: [{ price, quantity: 1 }],
    // The thread back to the account, read by `checkout.session.completed`.
    client_reference_id: session.user.id,
    subscription_data: { metadata: { userId: session.user.id } },
    /**
     * Floc sells in GBP only, and both Prices are GBP, so Stripe already
     * refuses any other currency. Collecting the billing address is what makes
     * a non-GB customer visible; Checkout has no country allow-list of its own.
     */
    billing_address_collection: "required",
    allow_promotion_codes: true,
    success_url: `${appUrl()}/settings?billing=done`,
    cancel_url: `${appUrl()}/settings?billing=cancelled`,
  });

  return Response.json({ url: checkout.url });
}

async function readInterval(
  request: Request,
): Promise<BillingInterval | null> {
  const body: unknown = await request.json().catch(() => null);
  const value =
    typeof body === "object" && body && "interval" in body
      ? (body as { interval: unknown }).interval
      : null;

  return BILLING_INTERVALS.find((i) => i === value) ?? null;
}

// Never echoes the reason into a page — the caller is our own fetch.
function refuse(status: number, message: string): Response {
  return Response.json({ error: message }, { status });
}
