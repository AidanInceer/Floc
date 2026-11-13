/** The phone's copy of an Explore listing from a wish list asks the list's people along (#623), as the web's does. */
import { PRESET_TRIPS } from "@floc/core/trip/explore/preset-trips";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { webPort } from "@/server/api-port/api-port";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

describe("startTripFromPreset with people along", () => {
  it("invites the people you could ask, and nobody else", async () => {
    const choice = { presetId: PRESET_TRIPS[0].id, month: null, startDate: null, ideas: true, events: true };
    const trip = await webPort.startTripFromPreset(world.member, choice, [world.admin, world.outsider]);

    const invites = await db.select({ tripId: schema.tripInvite.tripId, to: schema.tripInvite.toUserId }).from(schema.tripInvite).all();
    expect(invites).toEqual([{ tripId: trip?.id, to: world.admin }]);
  });
});
