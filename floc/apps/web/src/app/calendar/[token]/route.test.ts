import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { calendarFeedUrlFor, resetCalendarFeed } from "@/server/itinerary/feed/calendar-feed-link";

import { GET } from "./route";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

const poll = (url: string | null) => {
  const token = url!.split("/calendar/")[1];
  return GET(new Request(url!), { params: Promise.resolve({ token }) });
};

describe("a calendar app polling a member's feed (#334)", () => {
  it("gets the trip's calendar, kept out of shared caches and search", async () => {
    const response = await poll(await calendarFeedUrlFor(world.ours.id, world.member));
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/calendar; charset=utf-8");
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(await response.text()).toContain("X-WR-CALNAME:Ours");
  });

  it("gets nothing on a link the member has reset", async () => {
    const old = await calendarFeedUrlFor(world.ours.id, world.member);
    await resetCalendarFeed(world.ours.id, world.member);
    expect((await poll(old)).status).toBe(404);
  });

  it("gets nothing on a made-up link", async () => {
    const response = await GET(new Request("http://localhost/calendar/x.y.ics"), {
      params: Promise.resolve({ token: "x.y.ics" }),
    });
    expect(response.status).toBe(404);
  });
});
