import { and, eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { closeDayGaps, findDayGaps } from "@/db/repair/day-gaps";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

async function aTripWithAHole() {
  await db
    .update(schema.trip)
    .set({ startDate: "2026-09-01", endDate: "2026-09-03" })
    .where(eq(schema.trip.id, world.ours.id));
  const rows = await db
    .insert(schema.day)
    .values([
      { tripId: world.ours.id, date: "2026-09-02", deletedAt: new Date() },
      { tripId: world.ours.id, date: "2026-09-03" },
    ])
    .returning({ id: schema.day.id })
    .all();
  const hidden = await db
    .insert(schema.dayEvent)
    .values({ dayId: rows[0].id, type: "activity", title: "Old plan", orderIndex: 0 })
    .returning({ id: schema.dayEvent.id })
    .get();
  return { removedDayId: rows[0].id, hiddenEventId: hidden.id };
}

const liveDates = async () =>
  (
    await db
      .select({ date: schema.day.date, deletedAt: schema.day.deletedAt })
      .from(schema.day)
      .where(eq(schema.day.tripId, world.ours.id))
      .all()
  )
    .filter((d) => d.deletedAt === null)
    .map((d) => d.date)
    .sort();

describe("closing the gaps old removals left (#604)", () => {
  it("finds each date inside a trip's window with no day", async () => {
    await aTripWithAHole();
    expect(await findDayGaps()).toEqual([{ tripId: world.ours.id, name: "Ours", dates: ["2026-09-02"] }]);
  });

  it("ignores an undated trip and a trip with no gap", async () => {
    expect(await findDayGaps()).toEqual([]);
  });

  it("brings the missing day back, empty, and keeps every row (rule 8)", async () => {
    const { removedDayId, hiddenEventId } = await aTripWithAHole();

    await closeDayGaps(await findDayGaps());

    expect(await liveDates()).toEqual(["2026-09-01", "2026-09-02", "2026-09-03"]);
    const day = await db.select().from(schema.day).where(eq(schema.day.id, removedDayId)).get();
    expect(day?.deletedAt).toBeNull();
    const event = await db.select().from(schema.dayEvent).where(eq(schema.dayEvent.id, hiddenEventId)).get();
    expect(event?.deletedAt).not.toBeNull();
    expect(await findDayGaps()).toEqual([]);
  });

  it("adds a day where none was ever written", async () => {
    await db
      .update(schema.trip)
      .set({ startDate: "2026-09-01", endDate: "2026-09-03" })
      .where(eq(schema.trip.id, world.ours.id));
    await db.insert(schema.day).values({ tripId: world.ours.id, date: "2026-09-03" });

    await closeDayGaps(await findDayGaps());

    const added = await db
      .select()
      .from(schema.day)
      .where(and(eq(schema.day.tripId, world.ours.id), eq(schema.day.date, "2026-09-02")))
      .get();
    expect(added?.deletedAt).toBeNull();
  });

  it("leaves days missing at the ends of the window alone: only a middle gap closes", async () => {
    await db
      .update(schema.trip)
      .set({ startDate: "2026-08-30", endDate: "2026-09-05" })
      .where(eq(schema.trip.id, world.ours.id));

    expect(await findDayGaps()).toEqual([]);
  });
});
