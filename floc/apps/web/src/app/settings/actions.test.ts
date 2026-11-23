import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { readPrivacy } from "@/server/auth/privacy";
import { readTravelStyle } from "@/server/auth/travel-style";
import { migrateTestDb, resetDb, seedScenario, signIn, type Scenario } from "@/test/db";

import { updatePrivacy } from "./actions";

let world: Scenario;

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.append(key, value);
  return fd;
}

const rings = {
  visibilityVibeTags: "trip_members",
  visibilityTravelMap: "friends",
  visibilityFriends: "private",
  visibilitySaved: "friends",
};

const profile = async () => ({
  ...(await readPrivacy(world.member)),
  styleInGroupIdeas: (await readTravelStyle(world.member)).styleInGroupIdeas,
});

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  signIn(world.member);
});

describe("privacy", () => {
  it("saves each ring and the private switch", async () => {
    expect(await updatePrivacy(form({ ...rings, isPrivate: "on" }))).toEqual({});
    expect(await profile()).toMatchObject({
      isPrivate: true,
      visibilityVibeTags: "trip_members",
      visibilityTravelMap: "friends",
      visibilityFriends: "private",
      visibilitySaved: "friends",
    });
  });

  it("reads the latest-trip switch as latest, and its absence as all", async () => {
    await updatePrivacy(form({ ...rings, pastTripsLatest: "on" }));
    expect((await profile())?.pastTripsShow).toBe("latest");

    await updatePrivacy(form(rings));
    expect((await profile())?.pastTripsShow).toBe("all");
  });

  it("reads the trip-ideas switch as on, and its absence as off (#177, ADR-074)", async () => {
    expect((await profile())?.styleInGroupIdeas ?? true).toBe(true);

    await updatePrivacy(form(rings));
    expect((await profile())?.styleInGroupIdeas).toBe(false);

    await updatePrivacy(form({ ...rings, styleInGroupIdeas: "on" }));
    expect((await profile())?.styleInGroupIdeas).toBe(true);
  });

  it("refuses a ring that isn't one", async () => {
    expect(await updatePrivacy(form({ ...rings, visibilityFriends: "everyone" }))).toEqual({
      error: "That isn't one of the visibility options.",
    });
  });
});
