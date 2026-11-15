import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { TERMS_VERSION } from "@floc/core/legal/terms";

import { migrateTestDb, resetDb, seedScenario, signIn } from "@/test/db";

const create = vi.fn();
const billing = vi.hoisted(() => ({ configured: true }));

vi.mock("@/server/billing/billing", () => ({
  BILLING_INTERVALS: ["monthly", "yearly"],
  stripe: () => (billing.configured ? { checkout: { sessions: { create } } } : null),
  priceFor: () => "price_test",
  customerFor: async () => "cus_test",
}));

import { POST } from "./route";

const ask = (interval: unknown) =>
  POST(new Request("http://floc.test/api/billing/checkout", { method: "POST", body: JSON.stringify({ interval }) }));

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  create.mockReset().mockResolvedValue({ url: "https://checkout.stripe.test/session" });
  billing.configured = true;
  signIn((await seedScenario()).member);
});

describe("starting a Pro checkout", () => {
  it("says above the pay button that Pro starts now, and records the terms the buyer saw (#549)", async () => {
    const answer = await ask("monthly");
    expect(await answer.json()).toEqual({ url: "https://checkout.stripe.test/session" });
    const session = create.mock.calls[0][0];
    expect(session.custom_text.submit.message).toContain("/terms");
    expect(session.custom_text.submit.message).toContain("14 days");
    expect(session.subscription_data.metadata.termsVersion).toBe(TERMS_VERSION);
    expect(session.customer).toBe("cus_test");
  });

  it("refuses a visitor who is not signed in", async () => {
    signIn(null);
    expect((await ask("monthly")).status).toBe(401);
    expect(create).not.toHaveBeenCalled();
  });

  it("refuses a period it does not sell", async () => {
    expect((await ask("weekly")).status).toBe(400);
  });

  it("says billing is off when Stripe has no key", async () => {
    billing.configured = false;
    expect((await ask("monthly")).status).toBe(503);
  });
});
