import { and, eq, isNull } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { expectNotFound, migrateTestDb, resetDb, seedScenario, signIn, type Scenario } from "@/test/db";

import { clearMyAvailability, clearTripDates, saveAvailability, setTripDates } from "./actions";

let world: Scenario;

const marks = (userId: string) =>
  db
    .select({ date: schema.availability.date, available: schema.availability.available })
    .from(schema.availability)
    .where(and(eq(schema.availability.tripId, world.ours.id), eq(schema.availability.userId, userId)))
    .orderBy(schema.availability.date)
    .all();

const tripRow = () => db.select().from(schema.trip).where(eq(schema.trip.id, world.ours.id)).get();
const days = () =>
  db
    .select({ date: schema.day.date })
    .from(schema.day)
    .where(and(eq(schema.day.tripId, world.ours.id), isNull(schema.day.deletedAt)))
    .orderBy(schema.day.date)
    .all();

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  signIn(world.member);
});

describe("availability", () => {
  it("marks days free and busy for the viewer", async () => {
    await saveAvailability(world.ours.id, ["2026-09-01", "2026-09-02"], ["2026-09-03"]);
    expect(await marks(world.member)).toEqual([
      { date: "2026-09-01", available: true },
      { date: "2026-09-02", available: true },
      { date: "2026-09-03", available: false },
    ]);
  });

  it("refuses a well-shaped date that is not a day", async () => {
    await expect(saveAvailability(world.ours.id, ["2026-02-31"], [])).rejects.toThrow("Not a date: 2026-02-31");
    expect(await marks(world.member)).toEqual([]);
  });

  it("clears only the viewer's own marks", async () => {
    await saveAvailability(world.ours.id, ["2026-09-01"], []);
    signIn(world.admin);
    await saveAvailability(world.ours.id, ["2026-09-01"], []);

    await clearMyAvailability(world.ours.id);

    expect(await marks(world.admin)).toEqual([{ date: "2026-09-01", available: false }]);
    expect(await marks(world.member)).toEqual([{ date: "2026-09-01", available: true }]);
  });

  it("refuses a trip the viewer is not on (rule 5)", async () => {
    signIn(world.outsider);
    await expectNotFound(() => saveAvailability(world.ours.id, ["2026-09-01"], []));
  });
});

describe("the trip window", () => {
  it("sets the dates and lays out one day per date", async () => {
    await setTripDates(world.ours.id, "2026-10-01", "2026-10-03");
    expect(await tripRow()).toMatchObject({ startDate: "2026-10-01", endDate: "2026-10-03" });
    expect(await days()).toEqual([{ date: "2026-10-01" }, { date: "2026-10-02" }, { date: "2026-10-03" }]);
  });

  it("refuses half a window, one that ends before it starts, or one past a year, as a form error", async () => {
    expect((await setTripDates(world.ours.id, "2026-10-01", null)).error).toMatch(/Pick both/);
    expect((await setTripDates(world.ours.id, "2026-10-03", "2026-10-01")).error).toMatch(/before the start/);
    expect((await setTripDates(world.ours.id, "2026-01-01", "2029-01-01")).error).toMatch(/year/);
    expect((await tripRow())?.startDate).toBeNull();
  });

  it("goes back to undated, taking the days with it", async () => {
    await setTripDates(world.ours.id, "2026-10-01", "2026-10-02");
    await clearTripDates(world.ours.id);
    expect(await tripRow()).toMatchObject({ startDate: null, endDate: null });
    expect(await days()).toEqual([]);
  });
});
