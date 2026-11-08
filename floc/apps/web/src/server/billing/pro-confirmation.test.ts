import type Stripe from "stripe";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { confirmProStarted } from "@/server/billing/pro-confirmation";
import type { OutboundEmail } from "@/server/auth/email";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  vi.stubEnv("STRIPE_PRICE_QUARTERLY", "price_3m");
});
afterEach(() => vi.unstubAllEnvs());

function subscription(metadata: Record<string, string>) {
  return {
    id: "sub_1",
    metadata,
    items: { data: [{ current_period_end: Date.UTC(2027, 1, 8) / 1000, price: { id: "price_3m", unit_amount: 899, currency: "gbp" } }] },
  } as unknown as Stripe.Subscription;
}

function fakeStripe() {
  const update = vi.fn(async () => ({}));
  return { api: { subscriptions: { update } } as unknown as Stripe, update };
}

describe("the Pro confirmation email (#523)", () => {
  it("confirms the plan and states the 14-day consent given at checkout", async () => {
    const sent: OutboundEmail[] = [];
    const { api, update } = fakeStripe();

    await confirmProStarted(api, world.admin, subscription({ startNowConsentAt: "2026-11-08T10:00:00.000Z" }), async (batch) => {
      sent.push(...batch);
    });

    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe(`${world.admin}@example.test`);
    expect(sent[0].subject).toBe("You're on Floc Pro");
    expect(sent[0].lines.join(" ")).toContain("£8.99 every 3 months");
    expect(sent[0].lines.join(" ")).toContain(
      "On 8 Nov 2026 you asked for Pro to start straight away, and agreed that you lose your 14-day right to cancel once it starts.",
    );
    expect(update).toHaveBeenCalledWith("sub_1", { metadata: { confirmationSentAt: expect.any(String) } });
  });

  it("sends once, however often Stripe delivers the event", async () => {
    const send = vi.fn(async () => {});
    const { api } = fakeStripe();

    await confirmProStarted(api, world.admin, subscription({ confirmationSentAt: "2026-11-08T10:00:01.000Z" }), send);

    expect(send).not.toHaveBeenCalled();
  });
});
