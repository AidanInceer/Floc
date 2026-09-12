import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { billingStatusOf } from "@/server/billing/billing-status";
import { accountTokenFor } from "@/server/billing/store/account-token";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});
afterEach(() => {
  delete process.env.NEXT_PUBLIC_ALL_FEATURES_FREE;
});

const days = (n: number) => new Date(Date.now() + n * 86_400_000);

describe("your own Pro record", () => {
  it("is empty on the free plan, and still carries the account token", async () => {
    expect(await billingStatusOf(world.member)).toEqual({
      selling: true,
      accountToken: accountTokenFor(world.member),
      subscription: null,
    });
  });

  it("describes a store subscription as the app needs it", async () => {
    const end = days(10);
    await db.insert(schema.subscription).values({
      userId: world.member,
      status: "active",
      source: "play",
      storeTransactionId: "t-1",
      storeProductId: "floc_pro_monthly",
      currentPeriodEnd: end,
      cancelAtPeriodEnd: true,
    });

    expect((await billingStatusOf(world.member)).subscription).toEqual({
      status: "active",
      source: "play",
      storeProductId: "floc_pro_monthly",
      currentPeriodEnd: new Date(Math.floor(end.getTime() / 1000) * 1000).toISOString(),
      cancelAtPeriodEnd: true,
    });
  });

  it("shows the live subscription over a newer one that has lapsed", async () => {
    await db.insert(schema.subscription).values({
      userId: world.member,
      status: "active",
      source: "comp",
      currentPeriodEnd: null,
    });
    await db.insert(schema.subscription).values({
      userId: world.member,
      status: "canceled",
      source: "app_store",
      storeTransactionId: "t-2",
      currentPeriodEnd: days(-3),
    });

    const status = await billingStatusOf(world.member);
    expect(status.subscription?.source).toBe("comp");
    expect(status.subscription?.currentPeriodEnd).toBeNull();
  });

  it("is not selling while every feature is free", async () => {
    process.env.NEXT_PUBLIC_ALL_FEATURES_FREE = "true";
    expect((await billingStatusOf(world.member)).selling).toBe(false);
  });
});
