import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { webPort } from "@/server/api-port/api-port";
import { listDays, setTripWindow } from "@/server/itinerary/itinerary";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  await setTripWindow(world.ours.id, "2026-11-01", "2026-11-03", world.admin);
});

const missing = (fn: () => Promise<unknown>) => expect(fn()).rejects.toMatchObject({ kind: "missing" });

const middleDay = async () => (await listDays(world.ours.id))[1].id;

describe("removing a day from the phone (#604)", () => {
  it("tells a member what the removal will do", async () => {
    const plan = await webPort.dayRemovalPlan(world.member, world.ours.id, await middleDay());
    expect(plan).toMatchObject({ position: "middle", movedDays: 1, end: "2026-11-02" });
  });

  it("closes the gap the same way the web does", async () => {
    await webPort.removeDay(world.member, world.ours.id, await middleDay());
    expect((await listDays(world.ours.id)).map((d) => d.date)).toEqual(["2026-11-01", "2026-11-02"]);
  });

  it("answers a stranger as if the trip did not exist (rule 5)", async () => {
    const dayId = await middleDay();
    await missing(() => webPort.removeDay(world.outsider, world.ours.id, dayId));
    await missing(() => webPort.dayRemovalPlan(world.outsider, world.ours.id, dayId));
    expect(await listDays(world.ours.id)).toHaveLength(3);
  });

  it("will not reach another trip's day through this one", async () => {
    await missing(() => webPort.removeDay(world.member, world.ours.id, world.theirs.dayId));
  });
});
