import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { memberCalendar } from "@/server/itinerary/feed/calendar-feed";
import { calendarFeedUrlFor, resetCalendarFeed } from "@/server/itinerary/feed/calendar-feed-link";
import { readCalendarToken } from "@/server/itinerary/feed/calendar-link";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

const holderOf = (url: string | null) => readCalendarToken(url!.split("/calendar/")[1].replace(/\.ics$/, ""))!;
const opens = (url: string | null) => {
  const holder = holderOf(url);
  return memberCalendar(holder.tripId, holder.userId, holder.epoch);
};

describe("resetting a calendar feed link", () => {
  it("gives a new link that works and stops the old one", async () => {
    const before = await calendarFeedUrlFor(world.ours.id, world.member);
    const after = await resetCalendarFeed(world.ours.id, world.member);

    expect(after).not.toBe(before);
    expect(await opens(after)).toContain("X-WR-CALNAME:Ours");
    expect(await opens(before)).toBeNull();
    expect(await calendarFeedUrlFor(world.ours.id, world.member)).toBe(after);
  });

  it("leaves every other member's link working", async () => {
    const theirs = await calendarFeedUrlFor(world.ours.id, world.admin);
    await resetCalendarFeed(world.ours.id, world.member);
    expect(await opens(theirs)).toContain("X-WR-CALNAME:Ours");
  });

  it("has no link for someone not on the trip", async () => {
    expect(await calendarFeedUrlFor(world.ours.id, world.outsider)).toBeNull();
    expect(await resetCalendarFeed(world.ours.id, world.outsider)).toBeNull();
  });
});
