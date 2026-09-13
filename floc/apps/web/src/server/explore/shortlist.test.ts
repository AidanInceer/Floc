import { DEFAULT_ANSWERS } from "@floc/core/trip/explore/explore-match";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { listSaved, setSaved } from "@/server/explore/shortlist";
import { loadAnswers, saveAnswers } from "@/server/explore/explore-answers";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

describe("setSaved", () => {
  it("saves a listing, and unsaving hides it", async () => {
    await setSaved(world.admin, "amalfi-slow-week", true);
    expect(await listSaved(world.admin)).toEqual(["amalfi-slow-week"]);

    await setSaved(world.admin, "amalfi-slow-week", false);
    expect(await listSaved(world.admin)).toEqual([]);
  });

  it("brings a listing back after it was unsaved", async () => {
    await setSaved(world.admin, "amalfi-slow-week", true);
    await setSaved(world.admin, "amalfi-slow-week", false);
    await setSaved(world.admin, "amalfi-slow-week", true);
    expect(await listSaved(world.admin)).toEqual(["amalfi-slow-week"]);
  });

  it("refuses a fourth save", async () => {
    for (const id of ["amalfi-slow-week", "iceland-ring-road", "patagonia-w-trek"]) {
      expect(await setSaved(world.admin, id, true)).toBe("ok");
    }
    expect(await setSaved(world.admin, "japan-golden-route", true)).toBe("full");
    expect(await listSaved(world.admin)).toHaveLength(3);
  });

  it("ignores a listing that does not exist", async () => {
    expect(await setSaved(world.admin, "nowhere", true)).toBe("unknown");
    expect(await listSaved(world.admin)).toEqual([]);
  });

  it("keeps one person's saves from another", async () => {
    await setSaved(world.admin, "amalfi-slow-week", true);
    expect(await listSaved(world.member)).toEqual([]);
  });
});

describe("answers", () => {
  it("reads back what was saved, and nothing before", async () => {
    expect(await loadAnswers(world.admin)).toBeNull();
    await saveAnswers(world.admin, { ...DEFAULT_ANSWERS, pace: "move" });
    expect(await loadAnswers(world.admin)).toEqual({ ...DEFAULT_ANSWERS, pace: "move" });
  });
});
