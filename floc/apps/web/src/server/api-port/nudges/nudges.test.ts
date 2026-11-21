import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { nudgesPort } from "./nudges";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

describe("the nudges port (#705)", () => {
  it("lists who the viewer can nudge, then nudges them once", async () => {
    expect((await nudgesPort.nudgeTargets(world.admin, world.ours.id)).dates).toEqual([{ userId: world.member, name: "Mo", nudged: false }]);
    expect(await nudgesPort.sendNudges(world.admin, world.ours.id, "dates", [world.member])).toEqual({ sent: 1, capped: false });
    expect((await nudgesPort.nudgeTargets(world.admin, world.ours.id)).dates[0].nudged).toBe(true);
    expect(await db.select().from(schema.nudge).all()).toHaveLength(1);
  });

  it("hides a trip the viewer is not on (rule 5)", async () => {
    await expect(nudgesPort.sendNudges(world.outsider, world.ours.id, "dates", [world.member])).rejects.toThrow();
    expect(await db.select().from(schema.nudge).all()).toEqual([]);
  });
});
