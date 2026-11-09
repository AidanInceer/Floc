import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { PRESET_TRIPS } from "@floc/core/trip/explore/preset-trips";

import { db } from "@/db";
import { exploreSave } from "@/db/schema";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { savedTripIds, setTripSaved } from "@/server/explore/explore-saves";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

const [first, second] = PRESET_TRIPS.map((t) => t.id);

describe("saved Explore trips", () => {
  it("are none for someone who never saved one", async () => {
    expect(await savedTripIds(world.admin)).toEqual([]);
  });

  it("reads back a saved trip, newest first", async () => {
    await setTripSaved(world.admin, first, true);
    await setTripSaved(world.admin, second, true);
    expect(await savedTripIds(world.admin)).toEqual([second, first]);
  });

  it("takes a trip off when it is saved again as false, and keeps the row (rule 8)", async () => {
    await setTripSaved(world.admin, first, true);
    await setTripSaved(world.admin, first, false);
    expect(await savedTripIds(world.admin)).toEqual([]);
    expect(await db.select().from(exploreSave).all()).toHaveLength(1);
  });

  it("brings a removed trip back when it is saved again", async () => {
    await setTripSaved(world.admin, first, true);
    await setTripSaved(world.admin, first, false);
    await setTripSaved(world.admin, first, true);
    expect(await savedTripIds(world.admin)).toEqual([first]);
  });

  it("never shows one person's saves to another", async () => {
    await setTripSaved(world.admin, first, true);
    expect(await savedTripIds(world.member)).toEqual([]);
  });

  it("ignores a trip that is not on Explore", async () => {
    await setTripSaved(world.admin, "no-such-trip", true);
    expect(await db.select().from(exploreSave).all()).toHaveLength(0);
  });

  it("drops a saved trip that Explore no longer lists", async () => {
    await db.insert(exploreSave).values({ userId: world.admin, presetId: "retired-trip" });
    await setTripSaved(world.admin, first, true);
    expect(await savedTripIds(world.admin)).toEqual([first]);
  });
});
