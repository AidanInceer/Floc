import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { insertNudge } from "@/server/trips/roster";
import { topBarFor } from "@/server/chrome/top-bar";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

describe("the top bar's reads", () => {
  it("counts what the badges and the account menu show", async () => {
    await insertNudge({ tripId: world.ours.id, fromUserId: world.admin, toUserId: world.member, tab: "dates", message: null });

    const bar = await topBarFor(world.member, 3);

    expect(bar.notificationCount).toBe(1);
    expect(bar.latest).toHaveLength(1);
    expect(bar.inviteCount).toBe(0);
    expect(bar.friendRequestCount).toBe(0);
  });

  it("caps the menu preview at the limit asked for", async () => {
    for (const tab of ["dates", "money"] as const) {
      await insertNudge({ tripId: world.ours.id, fromUserId: world.admin, toUserId: world.member, tab, message: null });
    }

    expect((await topBarFor(world.member, 1)).latest).toHaveLength(1);
  });
});
