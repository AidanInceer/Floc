import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { setManualMark } from "@/server/itinerary/travel-map";
import { befriend, migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";

import { setTripSaved } from "./explore-saves";
import { friendsWhoSaved } from "./friend-saves";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  await setTripSaved(world.admin, "porto-to-seville", true);
});

async function rings(
  userId: string,
  rings: Partial<{
    visibilitySaved: "private" | "friends" | "trip_members";
    visibilityTravelMap: "private" | "friends" | "trip_members";
    isPrivate: boolean;
  }>,
): Promise<void> {
  await db.insert(schema.userProfile).values({ userId, ...rings });
}

describe("friends who saved what you saved (#544)", () => {
  it("names a friend who shares their list and saved the same trip", async () => {
    await befriend(world.admin, world.outsider);
    await rings(world.outsider, { visibilitySaved: "friends" });
    await setTripSaved(world.outsider, "porto-to-seville", true);

    const { trips } = await friendsWhoSaved(world.admin);

    expect(trips["porto-to-seville"]).toEqual([{ id: world.outsider, name: "Ozz" }]);
  });

  it("names nobody whose list is private, as it is by default", async () => {
    await befriend(world.admin, world.outsider);
    await setTripSaved(world.outsider, "porto-to-seville", true);

    expect((await friendsWhoSaved(world.admin)).trips).toEqual({});
  });

  it("names nobody whose whole profile is private", async () => {
    await befriend(world.admin, world.outsider);
    await rings(world.outsider, { visibilitySaved: "trip_members", isPrivate: true });
    await setTripSaved(world.outsider, "porto-to-seville", true);

    expect((await friendsWhoSaved(world.admin)).trips).toEqual({});
  });

  it("names no co-traveller who is not a friend", async () => {
    await rings(world.member, { visibilitySaved: "trip_members" });
    await setTripSaved(world.member, "porto-to-seville", true);

    expect((await friendsWhoSaved(world.admin)).trips).toEqual({});
  });

  it("leaves out trips you have not saved", async () => {
    await befriend(world.admin, world.outsider);
    await rings(world.outsider, { visibilitySaved: "friends" });
    await setTripSaved(world.outsider, "peru-sacred-valley", true);

    expect((await friendsWhoSaved(world.admin)).trips).toEqual({});
  });

  it("names a friend who wants to go to a country you want to go to", async () => {
    await befriend(world.admin, world.outsider);
    await setManualMark(world.admin, "JP", "yellow");
    await setManualMark(world.outsider, "JP", "yellow");
    await setManualMark(world.outsider, "PE", "yellow");

    const { countries } = await friendsWhoSaved(world.admin);

    expect(countries).toEqual({ JP: [{ id: world.outsider, name: "Ozz" }] });
  });

  it("names nobody whose travel map is shut to friends", async () => {
    await befriend(world.admin, world.outsider);
    await rings(world.outsider, { visibilityTravelMap: "private" });
    await setManualMark(world.admin, "JP", "yellow");
    await setManualMark(world.outsider, "JP", "yellow");

    expect((await friendsWhoSaved(world.admin)).countries).toEqual({});
  });
});
