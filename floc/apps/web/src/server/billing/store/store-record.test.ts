import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { canUseFeature } from "@/server/billing/entitlements";
import {
  ownerOfStoreTransaction,
  recordStoreSubscription,
} from "@/server/billing/store/store-record";
import type { StoreFacts } from "@/server/billing/store/store-facts";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

const facts = (over: Partial<StoreFacts> = {}): StoreFacts => ({
  storeTransactionId: "orig-1",
  productId: "floc_pro_yearly",
  status: "active",
  currentPeriodEnd: new Date(Date.now() + 30 * 86_400_000),
  cancelAtPeriodEnd: false,
  accountToken: null,
  ...over,
});

const rows = () =>
  db.select().from(schema.subscription).where(eq(schema.subscription.storeTransactionId, "orig-1"));

describe("recording a store subscription", () => {
  it("makes the account's trips Pro through the same gate as Stripe", async () => {
    await recordStoreSubscription({ userId: world.admin, source: "app_store", facts: facts() });
    expect(await canUseFeature("dates.weather", world.ours.id)).toBe(true);
  });

  it("overwrites on a repeat rather than adding a second row", async () => {
    await recordStoreSubscription({ userId: world.admin, source: "app_store", facts: facts() });
    await recordStoreSubscription({
      userId: world.admin,
      source: "app_store",
      facts: facts({ cancelAtPeriodEnd: true }),
    });

    const found = await rows();
    expect(found).toHaveLength(1);
    expect(found[0].cancelAtPeriodEnd).toBe(true);
    expect(found[0].source).toBe("app_store");
    expect(found[0].storeProductId).toBe("floc_pro_yearly");
  });

  it("refuses a purchase another account already holds", async () => {
    await recordStoreSubscription({ userId: world.admin, source: "play", facts: facts() });
    const second = await recordStoreSubscription({
      userId: world.outsider,
      source: "play",
      facts: facts(),
    });

    expect(second).toBe("taken");
    expect((await rows())[0].userId).toBe(world.admin);
  });

  it("closes the purchase a Play upgrade replaced", async () => {
    await recordStoreSubscription({
      userId: world.admin,
      source: "play",
      facts: facts({ storeTransactionId: "old-token" }),
    });
    await recordStoreSubscription({
      userId: world.admin,
      source: "play",
      facts: facts({ storeTransactionId: "new-token" }),
      replaces: "old-token",
    });

    const old = await db
      .select()
      .from(schema.subscription)
      .where(eq(schema.subscription.storeTransactionId, "old-token"))
      .get();
    expect(old?.status).toBe("canceled");
  });
});

describe("who owns a store purchase", () => {
  it("names the account that recorded it", async () => {
    await recordStoreSubscription({ userId: world.member, source: "app_store", facts: facts() });
    expect(await ownerOfStoreTransaction("orig-1")).toBe(world.member);
  });

  it("is nobody for a purchase never claimed", async () => {
    expect(await ownerOfStoreTransaction("never")).toBeNull();
  });
});
