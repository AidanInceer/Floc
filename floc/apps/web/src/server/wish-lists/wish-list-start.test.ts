/** "Start a wish list with <friend>" (#623): it copies only what you both saved, and only what they let you see. */
import { PRESET_TRIPS } from "@floc/core/trip/explore/preset-trips";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { befriend, migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";

import { startWishListWith } from "./wish-list-start";
import { wishListFor } from "./wish-lists";

let world: Scenario;
const [both, onlyTheirs] = PRESET_TRIPS.map((t) => t.id);

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  await befriend(world.admin, world.outsider);
  await befriend(world.outsider, world.admin);
  await db.insert(schema.exploreSave).values([
    { userId: world.admin, presetId: both },
    { userId: world.outsider, presetId: both },
    { userId: world.outsider, presetId: onlyTheirs },
  ]);
});

const shareSaved = () =>
  db.insert(schema.userProfile).values({ userId: world.outsider, visibilitySaved: "friends" });

describe("starting a wish list with a friend", () => {
  it("fills it with what you both saved and asks them", async () => {
    await shareSaved();
    const id = await startWishListWith(world.admin, world.outsider);

    const list = await wishListFor(world.admin, id);
    expect(list?.items.map((i) => i.presetId)).toEqual([both]);
    expect(list?.invited.map((p) => p.id)).toEqual([world.outsider]);
  });

  it("copies nothing while their Saved is private", async () => {
    const id = await startWishListWith(world.admin, world.outsider);
    expect((await wishListFor(world.admin, id))?.items).toEqual([]);
  });
});
