import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { ensureDays, listDaysWithEvents, listRouteDays, setOvernightPlaceOn, transportByDay } from "@/server/itinerary/itinerary";
import { readTripDays } from "@/server/itinerary/trip-days";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

async function makePlace(name: string, lat: number, lng: number, countryCode: string) {
  const row = await db.insert(schema.place).values({ name, lat, lng, countryCode }).returning({ id: schema.place.id }).get();
  return row.id;
}

const dayId = async (tripId: number, date: string) =>
  (await db.select({ id: schema.day.id, date: schema.day.date }).from(schema.day).where(eq(schema.day.tripId, tripId)).all()).find((d) => d.date === date)!.id;

async function plannedTrip() {
  await ensureDays(world.ours.id, ["2026-09-02", "2026-09-03"]);
  const porto = await makePlace("Porto", 41.15, -8.63, "PT");
  const lisbon = await makePlace("Lisbon", 38.72, -9.14, "PT");
  const second = await dayId(world.ours.id, "2026-09-02");
  await setOvernightPlaceOn(world.ours.id, [world.ours.dayId], porto);
  await setOvernightPlaceOn(world.ours.id, [second], lisbon);
  await db.insert(schema.dayEvent).values([
    { dayId: second, type: "activity", title: "Tiles museum", time: "15:00", orderIndex: 1 },
    { dayId: second, type: "transport", transportType: "car", title: "Hire car", time: "18:00", orderIndex: 3 },
    { dayId: second, type: "transport", transportType: "train", title: "Train", time: "09:00", endTime: "12:15", orderIndex: 2 },
  ]);
  const gone = await db.insert(schema.dayEvent).values({ dayId: second, type: "food", title: "Closed cafe", orderIndex: 4 }).returning({ id: schema.dayEvent.id }).get();
  await db.update(schema.dayEvent).set({ deletedAt: new Date() }).where(eq(schema.dayEvent.id, gone.id));
}

describe("readTripDays", () => {
  it("gives the same days, route and transport as the three separate reads", async () => {
    await plannedTrip();

    const together = await readTripDays(world.ours.id);

    expect(together.days).toEqual(await listDaysWithEvents(world.ours.id));
    expect(together.routeDays).toEqual(await listRouteDays(world.ours.id));
    expect(together.transport).toEqual(await transportByDay(world.ours.id));
  });

  it("reads nothing of another trip", async () => {
    await plannedTrip();

    const theirs = await readTripDays(world.theirs.id);

    expect(theirs.days.map((d) => d.id)).not.toContain(world.ours.dayId);
    expect(theirs.transport.size).toBe(0);
  });

  it("skips a deleted day (rule 8)", async () => {
    await db.update(schema.day).set({ deletedAt: new Date() }).where(eq(schema.day.id, world.ours.dayId));

    const { days, routeDays } = await readTripDays(world.ours.id);

    expect(days.map((d) => d.id)).not.toContain(world.ours.dayId);
    expect(routeDays.map((d) => d.dayId)).not.toContain(world.ours.dayId);
  });
});
