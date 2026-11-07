// The one read behind every bar's map on My trips: each trip's own route, from one query for the whole list.
import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { ensureDays, setOvernightPlaceOn } from "@/server/itinerary/itinerary";
import { routesForTrips } from "@/server/itinerary/routes-for-trips";

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

describe("routesForTrips", () => {
  it("gives each trip its own stops", async () => {
    await ensureDays(world.ours.id, ["2026-09-02", "2026-09-03"]);
    const porto = await makePlace("Porto", 41.15, -8.63, "PT");
    const paris = await makePlace("Paris", 48.86, 2.35, "FR");
    await setOvernightPlaceOn(world.ours.id, [world.ours.dayId, await dayId(world.ours.id, "2026-09-02")], porto);
    await setOvernightPlaceOn(world.theirs.id, [world.theirs.dayId], paris);

    const routes = await routesForTrips([world.ours.id, world.theirs.id]);
    expect(routes.get(world.ours.id)?.stops.map((s) => s.place)).toEqual(["Porto"]);
    expect(routes.get(world.theirs.id)?.stops.map((s) => s.place)).toEqual(["Paris"]);
  });

  it("reads how a leg travels from the day's transport event", async () => {
    await ensureDays(world.ours.id, ["2026-09-02", "2026-09-03"]);
    const porto = await makePlace("Porto", 41.15, -8.63, "PT");
    const lisbon = await makePlace("Lisbon", 38.72, -9.14, "PT");
    const second = await dayId(world.ours.id, "2026-09-02");
    await setOvernightPlaceOn(world.ours.id, [world.ours.dayId], porto);
    await setOvernightPlaceOn(world.ours.id, [second], lisbon);
    await db.insert(schema.dayEvent).values({ dayId: second, type: "transport", transportType: "train", title: "Train", time: "09:00", endTime: "12:15", orderIndex: 2 });

    const routes = await routesForTrips([world.ours.id]);
    expect(routes.get(world.ours.id)?.moves).toEqual([{ mode: "train", time: "3h 15" }]);
  });

  it("skips a deleted day (rule 8)", async () => {
    const porto = await makePlace("Porto", 41.15, -8.63, "PT");
    await setOvernightPlaceOn(world.ours.id, [world.ours.dayId], porto);
    await db.update(schema.day).set({ deletedAt: new Date() }).where(eq(schema.day.id, world.ours.dayId));

    const routes = await routesForTrips([world.ours.id]);
    expect(routes.get(world.ours.id)?.stops ?? []).toEqual([]);
  });

  it("asks nothing for an empty list", async () => {
    expect((await routesForTrips([])).size).toBe(0);
  });
});
