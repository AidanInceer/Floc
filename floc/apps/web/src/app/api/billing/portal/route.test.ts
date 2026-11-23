import type Stripe from "stripe";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { db, schema } from "@/db";
import { recordSubscription } from "@/server/billing/billing";
import { migrateTestDb, resetDb, seedScenario, signIn, type Scenario } from "@/test/db";

const open = vi.hoisted(() => vi.fn());
vi.mock("stripe", () => ({ default: class { billingPortal = { sessions: { create: open } }; } }));

import { POST } from "./route";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  signIn(world.member);
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_unit");
  open.mockReset().mockResolvedValue({ url: "https://billing.stripe.test/portal" });
});
afterEach(() => vi.unstubAllEnvs());

const paidOnStripe = (customer: string) =>
  recordSubscription({
    userId: world.member,
    sub: { id: "sub_1", customer, status: "active", items: { data: [] }, cancel_at_period_end: false, cancel_at: null } as unknown as Stripe.Subscription,
  });

describe("opening the billing portal", () => {
  it("opens it for the person's own Stripe customer", async () => {
    await paidOnStripe("cus_mine");

    const answer = await POST();

    expect(await answer.json()).toEqual({ url: "https://billing.stripe.test/portal" });
    expect(open.mock.calls[0][0]).toMatchObject({ customer: "cus_mine" });
    expect(open.mock.calls[0][0].return_url).toContain("/settings?section=billing");
  });

  it("opens it for the same customer when a granted Pro row is the person's newest", async () => {
    await paidOnStripe("cus_mine");
    await db.insert(schema.subscription).values({ userId: world.member, status: "active", source: "comp" });

    await POST();

    expect(open.mock.calls[0][0]).toMatchObject({ customer: "cus_mine" });
  });

  it("has nothing to manage for a person who never paid on Stripe", async () => {
    await db.insert(schema.subscription).values({ userId: world.member, status: "active", source: "comp" });

    const answer = await POST();

    expect(answer.status).toBe(404);
    expect(open).not.toHaveBeenCalled();
  });

  it("refuses a visitor who is not signed in", async () => {
    signIn(null);

    expect((await POST()).status).toBe(401);
    expect(open).not.toHaveBeenCalled();
  });
});
