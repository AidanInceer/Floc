import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { listLengthChoices, setLengthChoice } from "@/server/itinerary/trip-length";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

describe("trip length choices", () => {
  it("saves a length a person would like", async () => {
    await setLengthChoice(world.ours.id, world.member, "week", true);
    expect(await listLengthChoices(world.ours.id)).toEqual([{ userId: world.member, length: "week" }]);
  });

  it("takes a choice away without deleting the row, and brings it back (rule 8)", async () => {
    await setLengthChoice(world.ours.id, world.member, "week", true);
    await setLengthChoice(world.ours.id, world.member, "week", false);

    expect(await listLengthChoices(world.ours.id)).toEqual([]);
    expect(await db.select().from(schema.tripLengthChoice).all()).toHaveLength(1);

    await setLengthChoice(world.ours.id, world.member, "week", true);
    expect(await listLengthChoices(world.ours.id)).toEqual([{ userId: world.member, length: "week" }]);
    expect(await db.select().from(schema.tripLengthChoice).all()).toHaveLength(1);
  });

  it("keeps one row for each length a person picks", async () => {
    await setLengthChoice(world.ours.id, world.member, "week", true);
    await setLengthChoice(world.ours.id, world.member, "short_break", true);

    const mine = await listLengthChoices(world.ours.id);
    expect(mine.map((c) => c.length).sort()).toEqual(["short_break", "week"]);
  });

  it("lists one trip's choices only", async () => {
    await setLengthChoice(world.ours.id, world.member, "week", true);
    expect(await listLengthChoices(world.ours.id + 1000)).toEqual([]);
  });
});
