import type Stripe from "stripe";

import {
  recordSubscription,
  stripe,
  userIdForCustomer,
} from "@/server/billing/billing";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const api = stripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!api || !secret) return new Response("Not configured", { status: 503 });

  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Unsigned", { status: 400 });

  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = await api.webhooks.constructEventAsync(body, signature, secret);
  } catch {
    return new Response("Bad signature", { status: 400 });
  }

  await handle(api, event);
  return new Response("ok");
}

async function handle(api: Stripe, event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId = session.client_reference_id;
      if (!userId || typeof session.subscription !== "string") return;

      const sub = await api.subscriptions.retrieve(session.subscription);
      await recordSubscription({ userId, sub });
      return;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = await api.subscriptions.retrieve(event.data.object.id);
      const userId =
        sub.metadata?.userId ?? (await userIdForCustomer(sub.customer));
      if (!userId) return;

      await recordSubscription({ userId, sub });
      return;
    }

    default:
      return;
  }
}
