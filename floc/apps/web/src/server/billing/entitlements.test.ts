/**
 * The gate's states (ticket 246), and Pro as a person's own (#523). Written against the module
 * directly: every one of these should fail if the rule moves back into a caller.
 */
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

const weather = (userId: string) => canUseFeature("dates.weather", userId);

describe("who is Pro", () => {
  it("nobody, with no subscription anywhere", async () => {
    expect(await weather(world.admin)).toBe(false);
  });

  it("an active subscription makes its holder Pro", async () => {
    await give(world.admin);
    expect(await weather(world.admin)).toBe(true);
  });

  it("a trial counts as Pro", async () => {
    await give(world.admin, { status: "trialing" });
    expect(await weather(world.admin)).toBe(true);
  });

  it("cancelled but paid up is still Pro until the period ends", async () => {
    await give(world.admin, { cancelAtPeriodEnd: true });
    expect(await weather(world.admin)).toBe(true);
  });

  it("a period end in the past is not Pro, whatever the status says", async () => {
    await give(world.admin, { currentPeriodEnd: days(-1) });
    expect(await weather(world.admin)).toBe(false);
  });

  it("a cancelled subscription is not Pro", async () => {
    await give(world.admin, { status: "canceled" });
    expect(await weather(world.admin)).toBe(false);
  });
});

describe("comped access", () => {
  it("a comp with no end date is Pro, through the same path as a payment", async () => {
    await give(world.member, { source: "comp", currentPeriodEnd: null });
    expect(await weather(world.member)).toBe(true);
  });
});

describe("Pro is personal", () => {
  it("a Pro member's trip-mates stay free", async () => {
    await give(world.member);
    expect(await weather(world.admin)).toBe(false);
  });

  it("covers every gated feature for the holder only", async () => {
    await give(world.member);
    for (const feature of ["dates.weather", "packing.autoGenerate", "booking.prefill", "files.extraStorage"] as const) {
      expect(await canUseFeature(feature, world.member)).toBe(true);
      expect(await canUseFeature(feature, world.admin)).toBe(false);
    }
  });
});

describe("assertFeature", () => {
  it("refuses without Pro", async () => {
    await expect(assertFeature("dates.weather", world.admin)).rejects.toThrow(
      "Pro",
    );
  });

  it("refuses a free member even when a trip-mate is Pro", async () => {
    await give(world.member);
    await expect(assertFeature("packing.autoGenerate", world.admin)).rejects.toThrow("Pro");
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
    expect(await weather(world.admin)).toBe(true);
  });

  it("lets the write path through too", async () => {
    process.env.NEXT_PUBLIC_ALL_FEATURES_FREE = "true";
    await expect(
      assertFeature("dates.weather", world.admin),
    ).resolves.toBeUndefined();
  });

  it("does nothing when set to anything but true", async () => {
    process.env.NEXT_PUBLIC_ALL_FEATURES_FREE = "1";
    expect(await weather(world.admin)).toBe(false);
  });
});
