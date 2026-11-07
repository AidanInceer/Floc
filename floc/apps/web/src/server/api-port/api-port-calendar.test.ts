import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { webPort } from "@/server/api-port/api-port";
import { readCalendarToken } from "@/server/itinerary/feed/calendar-link";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

const holderOf = (url: string) => readCalendarToken(url.match(/\/calendar\/(.+)\.ics$/)?.[1] ?? "");

describe("the calendar link the phone asks for (#334)", () => {
  it("names the member who asked, on the trip they asked about", async () => {
    const url = await webPort.calendarFeedUrl(world.member, world.ours.id);
    expect(holderOf(url)).toEqual({ tripId: world.ours.id, userId: world.member, epoch: 0 });
  });

  it("is never minted for someone not on the trip", async () => {
    await expect(webPort.calendarFeedUrl(world.outsider, world.ours.id)).rejects.toThrow();
  });

  it("resets to a new number, which the next ask hands back", async () => {
    const url = await webPort.resetCalendarFeed(world.member, world.ours.id);
    expect(holderOf(url)?.epoch).toBe(1);
    expect(await webPort.calendarFeedUrl(world.member, world.ours.id)).toBe(url);
  });

  it("lets nobody off the trip reset a link", async () => {
    await expect(webPort.resetCalendarFeed(world.outsider, world.ours.id)).rejects.toThrow();
  });
});
