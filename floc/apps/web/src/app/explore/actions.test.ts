import { PRESET_TRIPS } from "@floc/core/trip/explore/preset-trips";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { savedTripIds } from "@/server/explore/explore-saves";
import { REDIRECT } from "@/test/setup";
import { migrateTestDb, resetDb, seedScenario, signIn, type Scenario } from "@/test/db";

import { saveTrip, startTripFromPreset } from "./actions";

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

describe("copying a listing from a wish list (#623)", () => {
  it("asks the people sent with it, and nobody you could not ask", async () => {
    const form = new FormData();
    form.set("presetId", trip);
    form.append("friendIds", world.admin);
    form.append("friendIds", world.outsider);
    await expect(startTripFromPreset(form)).rejects.toThrow(REDIRECT);

    const invites = await db.select({ to: schema.tripInvite.toUserId }).from(schema.tripInvite).all();
    expect(invites.map((i) => i.to)).toEqual([world.admin]);
  });
});
