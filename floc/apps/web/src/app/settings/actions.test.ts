import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
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
};

const profile = () =>
  db.select().from(schema.userProfile).where(eq(schema.userProfile.userId, world.member)).get();

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
    });
  });

  it("reads the latest-trip switch as latest, and its absence as all", async () => {
    await updatePrivacy(form({ ...rings, pastTripsLatest: "on" }));
    expect((await profile())?.pastTripsShow).toBe("latest");

    await updatePrivacy(form(rings));
    expect((await profile())?.pastTripsShow).toBe("all");
  });

  it("refuses a ring that isn't one", async () => {
    expect(await updatePrivacy(form({ ...rings, visibilityFriends: "everyone" }))).toEqual({
      error: "That isn't one of the visibility options.",
    });
  });
});
