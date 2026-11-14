import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { setManualMark, travelMapFor, travelMapsFor } from "@/server/itinerary/travel-map";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

async function sleepIn(tripId: number, dayId: number, countryCode: string) {
  const place = await db.insert(schema.place).values({ name: countryCode, countryCode }).returning({ id: schema.place.id }).get();
  await db.update(schema.day).set({ overnightPlaceId: place.id }).where(eq(schema.day.id, dayId));
  return tripId;
}

const endOn = (tripId: number, endDate: string | null) =>
  db.update(schema.trip).set({ startDate: endDate && "2020-01-01", endDate }).where(eq(schema.trip.id, tripId));

describe("the travel map", () => {
  it("colours a trip's country yellow while ahead and green once it has ended", async () => {
    await sleepIn(world.ours.id, world.ours.dayId, "PT");

    await endOn(world.ours.id, "2999-01-01");
    expect((await travelMapFor(world.member)).states).toEqual({ PT: "yellow" });

    await endOn(world.ours.id, "2020-01-02");
    expect((await travelMapFor(world.member)).states).toEqual({ PT: "green" });
  });

  it("lets a hand mark win over the trip, and counts only trips you are on", async () => {
    await sleepIn(world.ours.id, world.ours.dayId, "PT");
    await sleepIn(world.theirs.id, world.theirs.dayId, "JP");
    await setManualMark(world.member, "PT", "green");

    expect((await travelMapFor(world.member)).states).toEqual({ PT: "green" });
  });

  it("reads several people's maps at once, the same as one by one", async () => {
    await sleepIn(world.ours.id, world.ours.dayId, "PT");
    await sleepIn(world.theirs.id, world.theirs.dayId, "JP");
    await setManualMark(world.member, "PT", "green");
    await setManualMark(world.outsider, "PE", "yellow");
    const people = [world.admin, world.member, world.outsider];

    const maps = await travelMapsFor(people);

    for (const id of people) expect(maps.get(id)).toEqual(await travelMapFor(id));
    expect(maps.get(world.outsider)?.states).toEqual({ JP: "yellow", PE: "yellow" });
  });
});
