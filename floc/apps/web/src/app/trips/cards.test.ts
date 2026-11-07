import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { setOvernightPlaceOn } from "@/server/itinerary/itinerary";

import { loadTripCards } from "./cards";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

async function stayInPorto() {
  const porto = await db.insert(schema.place).values({ name: "Porto", lat: 41.15, lng: -8.63, countryCode: "PT" }).returning({ id: schema.place.id }).get();
  await setOvernightPlaceOn(world.ours.id, [world.ours.dayId], porto.id);
}

describe("loadTripCards", () => {
  it("gives each live card its route", async () => {
    await stayInPorto();
    const [ours] = await loadTripCards(world.admin, { archived: false });
    expect(ours!.card.route?.stops.map((s) => s.place)).toEqual(["Porto"]);
  });

  it("gives a trip with days but no stops an empty route", async () => {
    const [ours] = await loadTripCards(world.admin, { archived: false });
    expect(ours!.card.route?.stops).toEqual([]);
  });

  it("reads no route for an archived trip", async () => {
    await stayInPorto();
    await db.update(schema.trip).set({ archivedAt: new Date() }).where(eq(schema.trip.id, world.ours.id));
    const [ours] = await loadTripCards(world.admin, { archived: true });
    expect(ours!.card.route).toBeNull();
  });
});
