import { and, eq } from "drizzle-orm";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { assertFeature, canUseFeature, proStanding } from "@/server/billing/entitlements";
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

const weather = () => canUseFeature("dates.weather", world.admin);

describe("who is Pro", () => {
  it("nobody, with no subscription anywhere", async () => {
    expect(await weather()).toBe(false);
  });

  it("an active subscription makes that person Pro", async () => {
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
    await give(world.admin, { source: "comp", currentPeriodEnd: null });
    expect(await weather()).toBe(true);
  });
});

describe("Pro is personal (#523, ADR-041)", () => {
  it("gives a free member nothing from a Pro member on the same trip", async () => {
    await give(world.member);
    expect(await canUseFeature("dates.weather", world.member)).toBe(true);
    expect(await weather()).toBe(false);
  });

  it("stays with the person when they leave a trip", async () => {
    await give(world.member);
    await db
      .update(schema.tripMembership)
      .set({ deletedAt: new Date() })
      .where(eqMembership(world.ours.id, world.member));

    expect(await canUseFeature("dates.weather", world.member)).toBe(true);
  });
});

describe("proStanding (#523)", () => {
  it("leaves out someone who never had Pro", async () => {
    expect((await proStanding([world.admin])).has(world.admin)).toBe(false);
  });

  it("calls a live subscription Pro", async () => {
    await give(world.admin);
    expect((await proStanding([world.admin])).get(world.admin)).toBe("pro");
  });

  it("remembers someone whose Pro has ended", async () => {
    await give(world.admin, { status: "canceled" });
    expect((await proStanding([world.admin])).get(world.admin)).toBe("ended");
  });

  it("does not count a checkout that was never paid", async () => {
    await give(world.admin, { status: "incomplete_expired" });
    expect((await proStanding([world.admin])).has(world.admin)).toBe(false);
  });

  it("prefers a live subscription over an old one", async () => {
    await give(world.admin, { status: "canceled" });
    await give(world.admin);
    expect((await proStanding([world.admin])).get(world.admin)).toBe("pro");
  });
});

describe("assertFeature", () => {
  it("refuses without Pro", async () => {
    await expect(assertFeature("dates.weather", world.admin)).rejects.toThrow(
      "Pro",
    );
  });

  it("refuses a free member on a trip with a Pro member (#523)", async () => {
    await give(world.member);
    await expect(assertFeature("dates.weather", world.admin)).rejects.toThrow(
      "Pro",
    );
  });

  it("says nothing with Pro", async () => {
    await give(world.admin);
    await expect(
      assertFeature("dates.weather", world.admin),
    ).resolves.toBeUndefined();
  });
});

describe("the all-features-free switch", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_ALL_FEATURES_FREE;
  });

  it("hands a gated feature to a person with no subscription", async () => {
    process.env.NEXT_PUBLIC_ALL_FEATURES_FREE = "true";
    expect(await canUseFeature("dates.weather", world.admin)).toBe(true);
  });

  it("lets the write path through too", async () => {
    process.env.NEXT_PUBLIC_ALL_FEATURES_FREE = "true";
    await expect(
      assertFeature("dates.weather", world.admin),
    ).resolves.toBeUndefined();
  });

  it("counts everyone as Pro for storage too", async () => {
    process.env.NEXT_PUBLIC_ALL_FEATURES_FREE = "true";
    expect((await proStanding([world.admin])).get(world.admin)).toBe("pro");
  });

  it("does nothing when set to anything but true", async () => {
    process.env.NEXT_PUBLIC_ALL_FEATURES_FREE = "1";
    expect(await canUseFeature("dates.weather", world.admin)).toBe(false);
  });
});

function eqMembership(tripId: number, userId: string) {
  return and(
    eq(schema.tripMembership.tripId, tripId),
    eq(schema.tripMembership.userId, userId),
  );
}
