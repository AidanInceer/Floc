import Stripe from "stripe";
import { expect, it, vi } from "vitest";

import { checkApplication, checkGoogleSecret, checkStripeKey, checkWebhook, checkWebhookEndpoint, checkWebhookFormat } from "./checks";

const json = (body: object, status = 200) => new Response(JSON.stringify(body), { status });

it("refuses a Stripe key from a different account", async () => {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(json({ id: "acct_a" })).mockResolvedValueOnce(json({ id: "acct_b" }));
  await expect(checkStripeKey("sk_live_old", "sk_live_new", fetcher)).rejects.toThrow("different account");
});

it("refuses a Stripe key in the other mode before any request", async () => {
  const fetcher = vi.fn<typeof fetch>();
  await expect(checkStripeKey("sk_live_old", "sk_test_new", fetcher)).rejects.toThrow("same mode");
  expect(fetcher).not.toHaveBeenCalled();
});

it("accepts a restricted Stripe key on the same account", async () => {
  const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => json({ id: "acct_a" }));
  await checkStripeKey("sk_live_old", "rk_live_new", fetcher);
});

it("rejects a webhook secret without the whsec_ prefix", () => {
  expect(() => checkWebhookFormat("sk_live_wrong-field")).toThrow("whsec_");
  checkWebhookFormat("whsec_good");
});

it("refuses a webhook rotation when Stripe has no enabled floc.live endpoint", async () => {
  const none = vi.fn<typeof fetch>().mockResolvedValue(json({ data: [{ url: "https://floc.live/api/billing/webhook", status: "disabled" }] }));
  await expect(checkWebhookEndpoint("sk_test_x", none)).rejects.toThrow("no enabled webhook endpoint");
  const one = vi.fn<typeof fetch>().mockResolvedValue(json({ data: [{ url: "https://floc.live/api/billing/webhook", status: "enabled" }] }));
  await checkWebhookEndpoint("sk_test_x", one);
});

it("accepts a Google secret when Google only rejects the dummy code", async () => {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(json({ error: "invalid_grant" }, 400));
  await checkGoogleSecret("client.apps.googleusercontent.com", "GOCSPX-new", fetcher);
  expect(String(fetcher.mock.calls[0][1]?.body)).toContain("client_secret=GOCSPX-new");
});

it("rejects a Google secret that Google does not know", async () => {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(json({ error: "invalid_client" }, 401));
  await expect(checkGoogleSecret("client", "GOCSPX-wrong", fetcher)).rejects.toThrow("Google did not accept");
});

it("fails the application check on anything but 200", async () => {
  await expect(checkApplication(vi.fn<typeof fetch>().mockResolvedValue(new Response("", { status: 502 })))).rejects.toThrow("did not answer 200");
  await checkApplication(vi.fn<typeof fetch>().mockResolvedValue(new Response("ok")));
});

it("probes the webhook with a correctly signed event the route ignores", async () => {
  const secret = "whsec_test-replacement";
  const fetcher = vi.fn<typeof fetch>().mockImplementation(async (url, options) => {
    expect(url).toBe("https://floc.live/api/billing/webhook");
    const headers = options?.headers as Record<string, string>;
    const event = Stripe.webhooks.constructEvent(String(options?.body), headers["Stripe-Signature"], secret);
    expect(event.type).toBe("floc.rotation.probe");
    expect(event.data.object).toEqual({});
    return new Response("ok");
  });
  await checkWebhook(secret, fetcher);
});

it("fails the webhook probe when the deployed secret disagrees", async () => {
  await expect(checkWebhook("whsec_x", vi.fn<typeof fetch>().mockResolvedValue(new Response("", { status: 400 })))).rejects.toThrow("did not accept");
});
