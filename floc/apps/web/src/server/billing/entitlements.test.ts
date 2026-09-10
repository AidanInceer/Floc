/**
 * The gate's six states (ticket 246). Written against the module directly:
 * every one of these should fail if the rule moves back into a caller.
 */
import { and, eq } from "drizzle-orm";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { assertFeature, canUseFeature } from "@/server/billing/entitlements";
import type { SubscriptionSource, SubscriptionStatus } from "@/db/schema";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

const days = (n: number) => new Date(Date.now() + n * 86_400_000);

function give(
  userId: string,
  over: {
    status?: SubscriptionStatus;
    source?: SubscriptionSource;
    currentPeriodEnd?: Date | null;
    cancelAtPeriodEnd?: boolean;
  } = {},
) {
  return db.insert(schema.subscription).values({
    userId,
    status: over.status ?? "active",
    source: over.source ?? "stripe",
    currentPeriodEnd:
      over.currentPeriodEnd === undefined ? days(20) : over.currentPeriodEnd,
    cancelAtPeriodEnd: over.cancelAtPeriodEnd ?? false,
    stripeSubscriptionId: `sub_${userId}_${Math.random()}`,
  });
}

const weather = () => canUseFeature("dates.weather", world.ours.id);

describe("who is Pro", () => {
  it("nobody, with no subscription anywhere", async () => {
    expect(await weather()).toBe(false);
  });

  it("an active subscription makes the trip Pro", async () => {
    await give(world.admin);
    expect(await weather()).toBe(true);
  });

  it("a trial counts as Pro", async () => {
    await give(world.admin, { status: "trialing" });
    expect(await weather()).toBe(true);
  });

  it("cancelled but paid up is still Pro until the period ends", async () => {
    await give(world.admin, { cancelAtPeriodEnd: true });
    expect(await weather()).toBe(true);
  });

  it("a period end in the past is not Pro, whatever the status says", async () => {
    await give(world.admin, { currentPeriodEnd: days(-1) });
    expect(await weather()).toBe(false);
  });

  it("a cancelled subscription is not Pro", async () => {
    await give(world.admin, { status: "canceled" });
    expect(await weather()).toBe(false);
  });
});

describe("comped access", () => {
  it("a comp with no end date is Pro, through the same path as a payment", async () => {
    await give(world.member, { source: "comp", currentPeriodEnd: null });
    expect(await weather()).toBe(true);
  });
});

describe("who it spreads to", () => {
  it("one Pro member makes the whole trip Pro", async () => {
    await give(world.member);
    expect(await weather()).toBe(true);
  });

  it("does not leak to a trip the Pro member is not on", async () => {
    await give(world.admin);
    expect(await canUseFeature("dates.weather", world.theirs.id)).toBe(false);
  });

  it("a member who has left takes their Pro with them", async () => {
    await give(world.member);
    await db
      .update(schema.tripMembership)
      .set({ deletedAt: new Date() })
      .where(eqMembership(world.ours.id, world.member));

    expect(await weather()).toBe(false);
  });
});

describe("assertFeature", () => {
  it("refuses without Pro", async () => {
    await expect(assertFeature("dates.weather", world.ours.id)).rejects.toThrow(
      "Pro",
    );
  });

  it("says nothing with Pro", async () => {
    await give(world.admin);
    await expect(
      assertFeature("dates.weather", world.ours.id),
    ).resolves.toBeUndefined();
  });
});

describe("the all-features-free switch", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_ALL_FEATURES_FREE;
  });

  it("hands a gated feature to a trip with no subscription", async () => {
    process.env.NEXT_PUBLIC_ALL_FEATURES_FREE = "true";
    expect(await canUseFeature("dates.weather", world.ours.id)).toBe(true);
  });

  it("lets the write path through too", async () => {
    process.env.NEXT_PUBLIC_ALL_FEATURES_FREE = "true";
    await expect(
      assertFeature("dates.weather", world.ours.id),
    ).resolves.toBeUndefined();
  });

  it("does nothing when set to anything but true", async () => {
    process.env.NEXT_PUBLIC_ALL_FEATURES_FREE = "1";
    expect(await canUseFeature("dates.weather", world.ours.id)).toBe(false);
  });
});

function eqMembership(tripId: number, userId: string) {
  return and(
    eq(schema.tripMembership.tripId, tripId),
    eq(schema.tripMembership.userId, userId),
  );
}
