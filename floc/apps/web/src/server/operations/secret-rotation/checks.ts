import { createHmac } from "node:crypto";

import { requestJson } from "./http.ts";

const ORIGIN = "https://floc.live";

export async function checkStripeKey(current: string, next: string, fetcher: typeof fetch = fetch) {
  const mode = (value: string) => /^[sr]k_(test|live)_/.exec(value)?.[1];
  if (!mode(next) || mode(next) !== mode(current)) throw new Error("The new Stripe key is not the same mode (test or live) as the current one.");
  const account = (key: string) => requestJson<{ id?: string }>(fetcher, "https://api.stripe.com/v1/account", { headers: { Authorization: `Bearer ${key}` } });
  const [before, after] = [await account(current), await account(next)];
  if (!before.id || after.id !== before.id) throw new Error("The new Stripe key belongs to a different account.");
}

export function checkWebhookFormat(secret: string) {
  if (!/^whsec_\S+$/.test(secret)) throw new Error("The Stripe webhook secret must start with whsec_.");
}

// Why: production once held a signing secret with no endpoint behind it, so Stripe sent floc.live nothing.
export async function checkWebhookEndpoint(key: string, fetcher: typeof fetch = fetch) {
  const { data } = await requestJson<{ data?: { url: string; status: string }[] }>(fetcher,
    "https://api.stripe.com/v1/webhook_endpoints?limit=100", { headers: { Authorization: `Bearer ${key}` } });
  if (!data?.some((endpoint) => endpoint.url === `${ORIGIN}/api/billing/webhook` && endpoint.status === "enabled")) {
    throw new Error("Stripe has no enabled webhook endpoint for floc.live/api/billing/webhook in this account and mode. Add one first.");
  }
}

// Why: a dummy code tells the two apart — Google answers invalid_grant for a good secret, invalid_client for a bad one.
export async function checkGoogleSecret(clientId: string, secret: string, fetcher: typeof fetch = fetch) {
  const response = await fetcher("https://oauth2.googleapis.com/token", {
    method: "POST", redirect: "error", signal: AbortSignal.timeout(30_000),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, client_secret: secret, code: "floc-rotation-check",
      grant_type: "authorization_code", redirect_uri: `${ORIGIN}/api/auth/callback/google` }),
  });
  const { error } = await response.json().catch(() => ({})) as { error?: string };
  if (error !== "invalid_grant") throw new Error("Google did not accept the new client secret. A new secret can take a few minutes to work.");
}

export async function checkApplication(fetcher: typeof fetch = fetch) {
  const response = await fetcher(`${ORIGIN}/login`, { redirect: "error", signal: AbortSignal.timeout(30_000) });
  await response.body?.cancel();
  if (response.status !== 200) throw new Error("floc.live/login did not answer 200 after the deploy.");
}

// Why: an event type the route ignores proves the deployed signing secret without touching any subscription.
export async function checkWebhook(secret: string, fetcher: typeof fetch = fetch) {
  const timestamp = Math.floor(Date.now() / 1000);
  const body = JSON.stringify({ id: `evt_floc_rotation_${timestamp}`, object: "event", type: "floc.rotation.probe", data: { object: {} } });
  const signature = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
  const response = await fetcher(`${ORIGIN}/api/billing/webhook`, { method: "POST", redirect: "error",
    signal: AbortSignal.timeout(30_000), headers: { "Content-Type": "application/json", "Stripe-Signature": `t=${timestamp},v1=${signature}` }, body });
  await response.body?.cancel();
  if (response.status !== 200) throw new Error("The deployed webhook did not accept the new signing secret.");
}
