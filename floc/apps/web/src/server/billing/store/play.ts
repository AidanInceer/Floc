import "server-only";

import { GoogleAuth, OAuth2Client } from "google-auth-library";

import { log } from "@/server/observability/log";

import { playFacts, type PlaySubscription, type StoreFacts } from "./store-facts";

const PUBLISHER = "https://androidpublisher.googleapis.com/androidpublisher/v3/applications";

const REFUSED = new Set([400, 404, 410]);

export async function readPlaySubscription(
  token: string,
): Promise<{ facts: StoreFacts; replaces: string | null } | "refused" | "unavailable"> {
  const pkg = process.env.GOOGLE_PLAY_PACKAGE_NAME;
  const account = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT;
  if (!pkg || !account) return "unavailable";

  let sub: PlaySubscription;
  try {
    const auth = new GoogleAuth({
      credentials: JSON.parse(account),
      scopes: ["https://www.googleapis.com/auth/androidpublisher"],
    });
    const client = await auth.getClient();
    const response = await client.request<PlaySubscription>({
      url: `${PUBLISHER}/${encodeURIComponent(pkg)}/purchases/subscriptionsv2/tokens/${encodeURIComponent(token)}`,
    });
    sub = response.data;
  } catch (error) {
    const status = (error as { response?: { status?: number } }).response?.status;
    if (status && REFUSED.has(status)) return "refused";
    log.warn("billing.play-read-failed", { status: status ?? null });
    return "unavailable";
  }

  const facts = playFacts(token, sub);
  return facts ? { facts, replaces: sub.linkedPurchaseToken ?? null } : "refused";
}

export async function isPubSubPush(authorization: string | null): Promise<boolean> {
  const audience = process.env.GOOGLE_PLAY_RTDN_AUDIENCE;
  const pushAccount = process.env.GOOGLE_PLAY_RTDN_SERVICE_ACCOUNT;
  const idToken = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
  if (!audience || !pushAccount || !idToken) return false;

  try {
    const ticket = await new OAuth2Client().verifyIdToken({ idToken, audience });
    const payload = ticket.getPayload();
    return payload?.email === pushAccount && payload.email_verified === true;
  } catch {
    return false;
  }
}
