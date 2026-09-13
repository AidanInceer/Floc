import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { memberCalendar } from "@/server/itinerary/calendar-feed";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

describe("a member's trip calendar", () => {
  it("holds every live event on the trip, named for the trip", async () => {
    const ics = await memberCalendar(world.ours.id, world.member);
    expect(ics).toContain("X-WR-CALNAME:Ours");
    expect(ics).toContain("SUMMARY:Ours event");
    expect(ics).toContain("SUMMARY:Ours dinner");
    expect(ics).toContain("DTSTART:20260901T190000");
    expect(ics).not.toContain("Theirs");
  });

  it("drops a soft-deleted event", async () => {
    await db
      .update(schema.dayEvent)
      .set({ deletedAt: new Date() })
      .where(eq(schema.dayEvent.id, world.ours.lateEventId));
    expect(await memberCalendar(world.ours.id, world.member)).not.toContain("Ours dinner");
  });

  it("answers nothing to someone not on the trip, same as a trip that does not exist", async () => {
    expect(await memberCalendar(world.ours.id, world.outsider)).toBeNull();
    expect(await memberCalendar(999_999, world.member)).toBeNull();
  });

  it("stops answering once the member has left", async () => {
    await db
      .update(schema.tripMembership)
      .set({ deletedAt: new Date() })
      .where(eq(schema.tripMembership.userId, world.member));
    expect(await memberCalendar(world.ours.id, world.member)).toBeNull();
  });
});
