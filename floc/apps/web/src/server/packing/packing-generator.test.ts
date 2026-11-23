import { and, eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { db, schema } from "@/db";
import { givePro, migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { addDays, today } from "@floc/core/dates/dates";
import {
  insertPersonalPackingLine,
  listPersonalPackingLines,
  setPersonalPacked,
  softDeleteSuggestedLines,
  softDeletePackingLine,
  stepPersonalQuantity,
} from "@/server/packing/packing";
import {
  fillPersonalBag,
  packingPlanFor,
  takePackingIdea,
} from "@/server/packing/packing-generator";

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

describe("filling a bag", () => {
  it("writes no generated mark on the membership (ADR-077)", async () => {
    await fill();

    const row = await db
      .select()
      .from(schema.tripMembership)
      .where(and(eq(schema.tripMembership.tripId, world.ours.id), eq(schema.tripMembership.userId, world.admin)))
      .get();
    expect(row?.packGeneratedAt).toBeNull();
  });

  it("still fills nothing for someone who is not on the trip", async () => {
    const added = await fillPersonalBag({
      tripId: world.ours.id,
      ownerId: world.outsider,
      tier: "balanced",
      plan: await packingPlanFor((await tripRow())!),
    });

    expect(added).toBe(0);
  });
});

describe("what the trip tells us", () => {
  it("says so rather than throwing when the trip has no dates (rule 9)", async () => {
    const plan = await packingPlanFor((await tripRow())!);
    expect(plan).toEqual({ nights: null, climate: null, gap: "no-dates", places: [], hottest: null, firstRain: null });
  });

  it("counts the nights, and names the missing place rather than the missing forecast", async () => {
    await setDates("2026-09-01", "2026-09-06");
    const plan = await packingPlanFor((await tripRow())!);
    expect(plan.nights).toBe(5);
    expect(plan.climate).toBeNull();
    expect(plan.gap).toBe("no-place");
  });

  it("reads each stop's own forecast, not only the first stop's", async () => {
    await givePro(world.admin);
    const from = today();
    const cool = await db.insert(schema.place).values({ name: "Cool", providerId: "osm:test:cool", lat: 5.6037, lng: -0.187 }).returning().get();
    const hot = await db.insert(schema.place).values({ name: "Hot", providerId: "osm:test:hot", lat: 6.1319, lng: 1.2228 }).returning().get();
    await db.delete(schema.day).where(eq(schema.day.tripId, world.ours.id));
    await db.insert(schema.day).values([
      { tripId: world.ours.id, date: from, overnightPlaceId: cool.id },
      { tripId: world.ours.id, date: addDays(from, 1), overnightPlaceId: hot.id },
    ]);
    await setDates(from, addDays(from, 1));
    const temps: Record<string, number> = { "5.6037": 12, "6.1319": 31 };
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      const temp = temps[new URL(url).searchParams.get("lat") ?? ""];
      const timeseries = [0, 1].flatMap((d) => ["00", "06", "12", "18"].map((hh) => ({
        time: `${addDays(from, d)}T${hh}:00:00Z`,
        data: { instant: { details: { air_temperature: temp } }, next_6_hours: { summary: { symbol_code: "clearsky_day" } } },
      })));
      return { ok: true, json: async () => ({ properties: { timeseries } }) };
    }));

    const plan = await packingPlanFor((await tripRow())!);

    expect(plan.hottest).toBe(31);
    vi.unstubAllGlobals();
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
    await fill();
    await setDates("2026-07-01", "2026-07-08");

    const bagBefore = await myBag();
    const added = await fill();

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
    await softDeletePackingLine(shirts.id, "u-admin");

    expect(await fill()).toBe(1);
    expect((await myBag()).map((l) => l.label)).toContain("t-shirt");
  });
});

describe("suggested lines (#469)", () => {
  async function take(label: string) {
    return takePackingIdea({
      tripId: world.ours.id,
      ownerId: world.admin,
      tier: "balanced",
      plan: await packingPlanFor((await tripRow())!),
      label,
    });
  }

  it("marks every line a fill writes as suggested", async () => {
    await fill();
    const bag = await myBag();
    expect(bag.length).toBeGreaterThan(0);
    expect(bag.every((l) => l.origin === "suggested")).toBe(true);
  });

  it("takes one idea as one suggested line", async () => {
    expect(await take("toothbrush")).toBe(1);
    const bag = await myBag();
    expect(bag.map((l) => [l.label, l.origin])).toEqual([["toothbrush", "suggested"]]);
  });

  it("refuses a label that is not an idea, or one the bag already holds", async () => {
    expect(await take("jetpack")).toBe(0);
    await insertPersonalPackingLine(world.ours.id, world.admin, "Toothbrush", "toiletries");
    expect(await take("toothbrush")).toBe(0);
    expect((await myBag()).map((l) => l.origin)).toEqual([null]);
  });

  it("removes only the suggested lines not yet packed", async () => {
    await insertPersonalPackingLine(world.ours.id, world.admin, "Linen shirt", "clothes");
    await db.insert(schema.packingLine).values({
      tripId: world.ours.id, createdBy: world.admin, ownerId: world.admin, label: "Camera", category: "accessories", kitName: "Photography",
    });
    await take("toothbrush");
    await take("passport");
    const passport = (await myBag()).find((l) => l.label === "passport")!;
    await setPersonalPacked(passport.id, world.admin, true);

    expect(await softDeleteSuggestedLines(world.ours.id, world.admin)).toBe(1);
    expect((await myBag()).map((l) => l.label).sort()).toEqual(["Camera", "Linen shirt", "passport"]);
  });

  it("never reaches another member's bag", async () => {
    await takePackingIdea({
      tripId: world.ours.id, ownerId: world.member, tier: "balanced",
      plan: await packingPlanFor((await tripRow())!), label: "toothbrush",
    });
    expect(await softDeleteSuggestedLines(world.ours.id, world.admin)).toBe(0);
    expect(await listPersonalPackingLines(world.ours.id, world.member)).toHaveLength(1);
  });
});
