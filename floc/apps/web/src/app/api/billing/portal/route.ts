import { headers } from "next/headers";

import { appUrl } from "@/lib/env";
import { auth } from "@/server/auth/auth";
import { memberSession } from "@/server/auth/member-session";
import { portalUrlFor, subscriptionOf } from "@/server/billing/billing";

export const runtime = "nodejs";

export async function POST(): Promise<Response> {
  const session = memberSession(await auth.api.getSession({ headers: await headers() }));
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
