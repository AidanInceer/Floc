import { beforeEach, describe, expect, it, vi } from "vitest";

const getSession = vi.fn();
vi.mock("@/server/auth/auth", () => ({ auth: { api: { getSession } } }));

const create = vi.fn(async () => ({ url: "https://checkout.stripe.test/s1" }));
const billing = {
  stripe: vi.fn((): unknown => ({ checkout: { sessions: { create } } })),
  priceFor: vi.fn((): string | null => "price_quarterly"),
  customerFor: vi.fn(async () => "cus_1"),
};
vi.mock("@/server/billing/billing", () => billing);

const { POST } = await import("./route");

const ada = { user: { id: "u1", email: "ada@example.test", name: "Ada", isAnonymous: false } };

function ask(body: unknown) {
  return POST(new Request("http://localhost/api/billing/checkout", { method: "POST", body: JSON.stringify(body) }));
}

beforeEach(() => {
  getSession.mockResolvedValue(ada);
  create.mockClear();
  billing.stripe.mockReturnValue({ checkout: { sessions: { create } } });
  billing.priceFor.mockReturnValue("price_quarterly");
});

describe("starting a checkout (#523)", () => {
  it("records when the buyer ticked the 14-day consent on the subscription", async () => {
    const response = await ask({ interval: "quarterly", consent: "yes" });

    expect(await response.json()).toEqual({ url: "https://checkout.stripe.test/s1" });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: "cus_1",
        line_items: [{ price: "price_quarterly", quantity: 1 }],
        client_reference_id: "u1",
        subscription_data: { metadata: { userId: "u1", startNowConsentAt: expect.any(String) } },
      }),
    );
  });

  it("refuses a checkout without the consent tick", async () => {
    const response = await ask({ interval: "monthly" });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Tick the box to start Pro straight away." });
    expect(create).not.toHaveBeenCalled();
  });

  it("refuses a signed-out visitor", async () => {
    getSession.mockResolvedValue(null);
    expect((await ask({ interval: "monthly", consent: "yes" })).status).toBe(401);
  });

  it("says so when Stripe is not set up", async () => {
    billing.stripe.mockReturnValue(null);
    expect((await ask({ interval: "monthly", consent: "yes" })).status).toBe(503);
  });

  it("says so when the plan's price is not set up", async () => {
    billing.priceFor.mockReturnValue(null);
    expect((await ask({ interval: "quarterly", consent: "yes" })).status).toBe(503);
  });
});
