import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { expectNotFound, migrateTestDb, resetDb, seedScenario, signIn, type Scenario } from "@/test/db";
import { calendarFeedUrlFor } from "@/server/itinerary/feed/calendar-feed-link";

import { resetCalendarLink } from "./actions";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

describe("resetting your calendar feed link from Days (#334)", () => {
  it("hands back the member's new link", async () => {
    signIn(world.member);
    const before = await calendarFeedUrlFor(world.ours.id, world.member);
    const after = await resetCalendarLink(world.ours.id);
    expect(after).not.toBe(before);
    expect(await calendarFeedUrlFor(world.ours.id, world.member)).toBe(after);
  });

  it("is refused to someone not on the trip, as a trip that does not exist (rule 5)", async () => {
    signIn(world.outsider);
    await expectNotFound(() => resetCalendarLink(world.ours.id));
  });
});
