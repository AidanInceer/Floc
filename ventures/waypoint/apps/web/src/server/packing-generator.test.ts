/**
 * The generator against a real database (ticket 221). The scenario's trips have
 * no place with coordinates, so `getTripForecast` bails before any fetch — these
 * exercise the degrade path and the write, and the pure catalogue tests cover
 * what the weather does to the list.
 */
import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import {
  listPersonalPackingLines,
  setPersonalPacked,
  softDeletePackingLine,
  stepPersonalQuantity,
} from "@/server/packing";
import { getPackSettings } from "@/server/packing";
import {
  autoFillPersonalBag,
  fillPersonalBag,
  packingPlanFor,
} from "@/server/packing-generator";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

async function setDates(start: string | null, end: string | null) {
  await db
    .update(schema.trip)
    .set({ startDate: start, endDate: end })
    .where(eq(schema.trip.id, world.ours.id));
}

async function tripRow() {
  return db
    .select()
    .from(schema.trip)
    .where(eq(schema.trip.id, world.ours.id))
    .get();
}

async function fill() {
  return fillPersonalBag({
    tripId: world.ours.id,
    ownerId: world.admin,
    tier: "balanced",
    plan: await packingPlanFor((await tripRow())!),
  });
}

async function myBag() {
  return listPersonalPackingLines(world.ours.id, world.admin);
}

describe("what the trip tells us", () => {
  it("says so rather than throwing when the trip has no dates (rule 9)", async () => {
    const plan = await packingPlanFor((await tripRow())!);
    expect(plan).toEqual({ nights: null, climate: null, gap: "no-dates" });
  });

  it("counts the nights, and names the missing place rather than the missing forecast", async () => {
    await setDates("2026-09-01", "2026-09-06");
    const plan = await packingPlanFor((await tripRow())!);
    expect(plan.nights).toBe(5);
    expect(plan.climate).toBeNull();
    expect(plan.gap).toBe("no-place");
  });
});

describe("filling a bag", () => {
  it("writes a starter list even with nothing to go on (rule 11)", async () => {
    const added = await fill();
    expect(added).toBeGreaterThan(0);

    const bag = await myBag();
    expect(bag).toHaveLength(added);
    expect(bag.map((l) => l.label)).toContain("toothbrush");
    for (const line of bag) expect(line.quantity).toBeGreaterThanOrEqual(1);
  });

  it("sizes the counts from the dates once it has them", async () => {
    await setDates("2026-09-01", "2026-09-06");
    await fill();
    const shirts = (await myBag()).find((l) => l.label === "t-shirt");
    expect(shirts?.quantity).toBe(5);
  });

  it("fills nobody else's bag", async () => {
    await fill();
    expect(await listPersonalPackingLines(world.ours.id, world.member)).toEqual([]);
  });
});

describe("a second fill never costs you an edit", () => {
  it("leaves an edited line's count, tick and place alone", async () => {
    await fill();
    const before = await myBag();
    const shirts = before.find((l) => l.label === "t-shirt")!;

    await stepPersonalQuantity(shirts.id, world.admin, 1);
    await setPersonalPacked(shirts.id, world.admin, true);

    const added = await fill();
    expect(added).toBe(0);

    const after = await myBag();
    expect(after).toHaveLength(before.length);

    const same = after.find((l) => l.id === shirts.id)!;
    expect(same.quantity).toBe(shirts.quantity + 1);
    expect(same.packedAt).not.toBeNull();
  });

  it("tops up what a longer trip now needs, and nothing else", async () => {
    await fill(); // undated: the generic starter list
    await setDates("2026-07-01", "2026-07-08");

    const bagBefore = await myBag();
    const added = await fill();

    // Same kinds of thing without a forecast, so a longer window adds no rows —
    // the point is that it doesn't *rewrite* the counts either (rule 7 is for
    // people, not for a generator second-guessing them).
    expect(added).toBe(0);
    expect((await myBag()).map((l) => l.quantity)).toEqual(
      bagBefore.map((l) => l.quantity),
    );
  });

  it("adds nothing on a second press", async () => {
    await fill();
    const bag = await myBag();
    expect(await fill()).toBe(0);
    expect(await myBag()).toHaveLength(bag.length);
  });

  it("re-suggests something you removed, since asking again is the whole action", async () => {
    await fill();
    const shirts = (await myBag()).find((l) => l.label === "t-shirt")!;
    await softDeletePackingLine(shirts.id);

    expect(await fill()).toBe(1);
    expect((await myBag()).map((l) => l.label)).toContain("t-shirt");
  });
});

describe("the automatic fill happens once, ever", () => {
  const auto = async () =>
    autoFillPersonalBag({
      tripId: world.ours.id,
      ownerId: world.admin,
      tier: "balanced",
      plan: await packingPlanFor((await tripRow())!),
    });

  // The page skips the call entirely once this is set, so the flag has to be
  // readable from outside the fill or the tab pays for a write transaction on
  // every render (ticket 231).
  it("reports through the membership whether it has run", async () => {
    expect(
      (await getPackSettings(world.ours.id, world.admin)).generatedAt,
    ).toBeNull();

    await auto();

    expect(
      (await getPackSettings(world.ours.id, world.admin)).generatedAt,
    ).toBeInstanceOf(Date);
  });

  it("fills on the first open and never again", async () => {
    await auto();
    const first = await myBag();
    expect(first.length).toBeGreaterThan(0);

    await auto();
    expect(await myBag()).toHaveLength(first.length);
  });

  it("leaves a bag you deliberately emptied empty", async () => {
    await auto();
    for (const line of await myBag()) await softDeletePackingLine(line.id);

    await auto();
    expect(await myBag()).toEqual([]);
  });

  /*
   * No test forces two of these to overlap. Concurrency here is the write
   * transaction's job, and the local-file driver these tests run on answers
   * contention with SQLITE_BUSY and a poisoned connection — so such a test
   * would measure the driver, then break every test after it. What the code
   * promises is in `fillInTransaction`: one transaction around the claim, the
   * read and the insert, and lock contention reported as "added nothing".
   */
});
