import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { setOvernightPlaceOn } from "@/server/itinerary/itinerary";
import { loadPastTripMaps } from "@/server/trips/past-trip-maps";

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

const endOurs = () =>
  db.update(schema.trip).set({ startDate: "2020-01-01", endDate: "2020-01-05" }).where(eq(schema.trip.id, world.ours.id));

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

  it("leaves the route of a past trip unread on first load", async () => {
    await stayInPorto();
    await endOurs();
    const reads = vi.spyOn(db.$client, "execute");
    const [ours] = await loadTripCards(world.admin, { archived: false });
    const readEvents = reads.mock.calls.some(([statement]) => /day_event/.test(JSON.stringify(statement)));
    reads.mockRestore();

    expect(ours!.card.route).toBeUndefined();
    expect(readEvents).toBe(false);
  });

  it("names a past trip's first stay on first load, past days with no place", async () => {
    await stayInPorto();
    await endOurs();
    await db.insert(schema.day).values({ tripId: world.ours.id, date: "2026-08-31" });

    const [ours] = await loadTripCards(world.admin, { archived: false });

    expect(ours!.card.where).toBe("Porto");
  });

  it("says no place for a past trip with no stay", async () => {
    await endOurs();
    const [ours] = await loadTripCards(world.admin, { archived: false });
    expect(ours!.card.where).toBeNull();
  });
});

describe("loadPastTripMaps", () => {
  it("gives each past trip its route", async () => {
    await stayInPorto();
    await endOurs();

    const [ours, ...rest] = await loadPastTripMaps(world.admin);

    expect(rest).toEqual([]);
    expect(ours!.id).toBe(world.ours.id);
    expect(ours!.route?.stops.map((s) => s.place)).toEqual(["Porto"]);
  });

  it("holds no live trip", async () => {
    await stayInPorto();
    expect(await loadPastTripMaps(world.admin)).toEqual([]);
  });

  it("holds no trip the person is not on", async () => {
    await endOurs();
    expect(await loadPastTripMaps(world.outsider)).toEqual([]);
  });
});
