/**
 * A link into Stripe's hosted billing portal (ticket 247).
 *
 * The customer id is read from the signed-in account's own row and never
 * taken from the request, so nobody can ask for a portal into someone else's
 * billing by guessing an id.
 */
import { headers } from "next/headers";

import { appUrl } from "@/lib/env";
import { auth } from "@/server/auth";
import { portalUrlFor, subscriptionOf } from "@/server/billing";

export const runtime = "nodejs";

export async function POST(): Promise<Response> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return refuse(401, "Sign in first");

  const row = await subscriptionOf(session.user.id);
  if (!row?.stripeCustomerId) return refuse(404, "No subscription to manage");

  const url = await portalUrlFor({
    customerId: row.stripeCustomerId,
    returnUrl: `${appUrl()}/settings?section=billing`,
  });

  if (!url) return refuse(503, "Billing is not configured");
  return Response.json({ url });
}

function refuse(status: number, message: string): Response {
  return Response.json({ error: message }, { status });
}
