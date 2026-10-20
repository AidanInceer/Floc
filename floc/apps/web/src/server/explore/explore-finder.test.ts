import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { EMPTY_FINDER, type Finder } from "@floc/core/trip/explore/finder/finder";

import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { ensureProfile, updateProfileFields } from "@/server/auth/profile";
import { loadFinder, saveFinder } from "@/server/explore/explore-finder";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

const MINE: Finder = { ...EMPTY_FINDER, regions: ["Asia"], months: [5], likes: ["Food"] };

describe("the saved finder", () => {
  it("is nothing for someone who never set one", async () => {
    expect(await loadFinder(world.admin)).toBeNull();
  });

  it("reads back what was saved", async () => {
    await saveFinder(world.admin, MINE);
    expect(await loadFinder(world.admin)).toEqual(MINE);
  });

  it("does not keep what was typed in the search box", async () => {
    await saveFinder(world.admin, { ...MINE, q: "kyoto" });
    expect((await loadFinder(world.admin))?.q).toBe("");
  });

  it("reads answers from before the finder as nothing", async () => {
    await ensureProfile(world.admin);
    await updateProfileFields(world.admin, { exploreAnswers: { size: "5-8", when: "summer", cost: "more", pace: "base", nights: 14 } });
    expect(await loadFinder(world.admin)).toBeNull();
  });
});
