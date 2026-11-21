import { and, eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import {
  clearAvailabilityFor,
  listAvailability,
  setAvailability,
  setPreferredDays,
} from "@/server/itinerary/availability";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

describe("availability", () => {
  it("upserts a batch, then flips it without deleting the rows", async () => {
    const dates = ["2026-09-01", "2026-09-02"];
    await setAvailability(world.ours.id, world.member, dates, true);

    const marks = () =>
      db
        .select()
        .from(schema.availability)
        .where(
          and(
            eq(schema.availability.tripId, world.ours.id),
            eq(schema.availability.userId, world.member),
          ),
        )
        .all();

    expect((await marks()).map((m) => m.available)).toEqual([true, true]);

    await setAvailability(world.ours.id, world.member, dates, false);
    expect(await marks()).toHaveLength(2);
    expect((await marks()).every((m) => m.available === false)).toBe(true);

    await setAvailability(world.ours.id, world.member, dates, true);
    await clearAvailabilityFor(world.ours.id, world.member);
    expect((await marks()).every((m) => m.available === false)).toBe(true);
  });

  it("hands back the false rows too — Dates tells 'said no' from 'hasn't looked'", async () => {
    await setAvailability(world.ours.id, world.member, ["2026-09-01"], false);
    expect(await listAvailability(world.ours.id)).toEqual([
      { userId: world.member, date: "2026-09-01", available: false, preferred: false },
    ]);
  });

  it("marks a day preferred, which also makes it free", async () => {
    await setPreferredDays(world.ours.id, world.member, ["2026-09-01"], true);
    expect(await listAvailability(world.ours.id)).toEqual([
      { userId: world.member, date: "2026-09-01", available: true, preferred: true },
    ]);
  });

  it("drops the preference and keeps the day free", async () => {
    await setPreferredDays(world.ours.id, world.member, ["2026-09-01", "2026-09-02"], true);
    await setPreferredDays(world.ours.id, world.member, ["2026-09-01"], false);
    expect((await listAvailability(world.ours.id)).map((r) => [r.date, r.available, r.preferred])).toEqual([
      ["2026-09-01", true, false],
      ["2026-09-02", true, true],
    ]);
  });

  it("takes the preference off a day marked not free", async () => {
    await setPreferredDays(world.ours.id, world.member, ["2026-09-01"], true);
    await setAvailability(world.ours.id, world.member, ["2026-09-01"], false);
    expect(await listAvailability(world.ours.id)).toEqual([
      { userId: world.member, date: "2026-09-01", available: false, preferred: false },
    ]);
  });

  it("keeps a preference when the day is marked free again, as a calendar fill does", async () => {
    await setPreferredDays(world.ours.id, world.member, ["2026-09-01"], true);
    await setAvailability(world.ours.id, world.member, ["2026-09-01"], true);
    expect((await listAvailability(world.ours.id))[0].preferred).toBe(true);
  });

  it("clears the preferences with the days", async () => {
    await setPreferredDays(world.ours.id, world.member, ["2026-09-01"], true);
    await clearAvailabilityFor(world.ours.id, world.member);
    expect(await listAvailability(world.ours.id)).toEqual([
      { userId: world.member, date: "2026-09-01", available: false, preferred: false },
    ]);
  });

  it("is a no-op on an empty batch", async () => {
    await setAvailability(world.ours.id, world.member, [], true);
    expect(await db.select().from(schema.availability).all()).toHaveLength(0);
  });
});
