import { PRESET_TRIPS } from "@floc/core/trip/explore/preset-trips";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { webPort } from "@/server/api-port/api-port";

let world: Scenario;
const trip = PRESET_TRIPS[0].id;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

describe("the heart through the phone's door (#467)", () => {
  it("saves and unsaves a trip for that person only", async () => {
    await webPort.setTripSaved(world.member, trip, true);
    expect(await webPort.listSavedTrips(world.member)).toEqual([trip]);
    expect(await webPort.listSavedTrips(world.outsider)).toEqual([]);

    await webPort.setTripSaved(world.member, trip, false);
    expect(await webPort.listSavedTrips(world.member)).toEqual([]);
  });
});
