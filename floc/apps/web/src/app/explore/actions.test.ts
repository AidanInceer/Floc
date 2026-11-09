import { PRESET_TRIPS } from "@floc/core/trip/explore/preset-trips";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { savedTripIds } from "@/server/explore/explore-saves";
import { REDIRECT } from "@/test/setup";
import { migrateTestDb, resetDb, seedScenario, signIn, type Scenario } from "@/test/db";

import { saveTrip } from "./actions";

let world: Scenario;
const trip = PRESET_TRIPS[0].id;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  signIn(world.member);
});

describe("the heart on Explore", () => {
  it("saves a trip, and a second tap takes it off", async () => {
    await saveTrip(trip, true);
    expect(await savedTripIds(world.member)).toEqual([trip]);
    await saveTrip(trip, false);
    expect(await savedTripIds(world.member)).toEqual([]);
  });

  it("sends a signed-out visitor to sign in, back to the page with the save asked for", async () => {
    signIn(null);
    const back = encodeURIComponent(`/explore/${trip}?save=${trip}`);
    await expect(saveTrip(trip, true)).rejects.toThrow(`${REDIRECT}:/login?redirect=${back}`);
    expect(await savedTripIds(world.member)).toEqual([]);
  });
});
