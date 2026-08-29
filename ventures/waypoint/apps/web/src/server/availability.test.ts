/**
 * Availability's one non-obvious rule (ticket 242, split out of
 * membership.test.ts): unmarking flips a row to `false` and never deletes it,
 * because the unique index ignores `deleted_at`.
 */
import { and, eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import {
  clearAvailabilityFor,
  listAvailability,
  setAvailability,
} from "@/server/availability";

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

    // Unmarking writes false rather than soft-deleting: the unique index ignores deleted_at, so a dead row would bar the date for good.
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
      { userId: world.member, date: "2026-09-01", available: false },
    ]);
  });

  it("is a no-op on an empty batch", async () => {
    await setAvailability(world.ours.id, world.member, [], true);
    expect(await db.select().from(schema.availability).all()).toHaveLength(0);
  });
});
