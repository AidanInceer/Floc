import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sub = { id: "sub_1", customer: "cus_1", metadata: {} as Record<string, string> };
const constructEventAsync = vi.fn();
const api = {
  webhooks: { constructEventAsync },
  subscriptions: { retrieve: vi.fn(async () => sub) },
};
const billing = {
  stripe: vi.fn((): unknown => api),
  recordSubscription: vi.fn(async () => undefined),
  userIdForCustomer: vi.fn(async (): Promise<string | null> => "u1"),
};
vi.mock("@/server/billing/billing", () => billing);

const confirmProStarted = vi.fn(async () => undefined);
vi.mock("@/server/billing/pro-confirmation", () => ({ confirmProStarted }));

const { POST } = await import("./route");

const saved = { ...process.env };

function deliver(event: unknown, signature: string | null = "t=1,v1=abc") {
  constructEventAsync.mockResolvedValue(event);
  return POST(
    new Request("http://localhost/api/billing/webhook", {
      method: "POST",
      body: JSON.stringify(event),
      headers: signature ? { "stripe-signature": signature } : {},
    }),
  );
}

beforeEach(() => {
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
  vi.clearAllMocks();
  billing.stripe.mockReturnValue(api);
});
afterEach(() => {
  process.env = { ...saved };
});

describe("the Stripe webhook", () => {
  it("records a finished checkout and sends the Pro confirmation once (#523)", async () => {
    const response = await deliver({
      type: "checkout.session.completed",
      data: { object: { client_reference_id: "u1", subscription: "sub_1" } },
    });

    expect(response.status).toBe(200);
    expect(billing.recordSubscription).toHaveBeenCalledWith({ userId: "u1", sub });
    expect(confirmProStarted).toHaveBeenCalledWith(api, "u1", sub);
  });

  it("records a changed plan without sending the confirmation again", async () => {
    await deliver({ type: "customer.subscription.updated", data: { object: { id: "sub_1" } } });

    expect(billing.recordSubscription).toHaveBeenCalledWith({ userId: "u1", sub });
    expect(confirmProStarted).not.toHaveBeenCalled();
  });

  it("refuses an unsigned body before reading it", async () => {
    const response = await deliver({ type: "checkout.session.completed" }, null);

    expect(response.status).toBe(400);
    expect(constructEventAsync).not.toHaveBeenCalled();
  });

  it("refuses a body whose signature does not hold", async () => {
    constructEventAsync.mockRejectedValueOnce(new Error("bad"));
    const response = await POST(
      new Request("http://localhost/api/billing/webhook", { method: "POST", body: "{}", headers: { "stripe-signature": "x" } }),
    );

    expect(response.status).toBe(400);
    expect(billing.recordSubscription).not.toHaveBeenCalled();
  });

  it("says so when Stripe is not set up", async () => {
    billing.stripe.mockReturnValue(null);
    expect((await deliver({ type: "ping" })).status).toBe(503);
  });
});
