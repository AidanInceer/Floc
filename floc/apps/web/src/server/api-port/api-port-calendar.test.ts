import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { webPort } from "@/server/api-port/api-port";
import { readCalendarToken } from "@/server/itinerary/calendar-link";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

describe("the calendar link the phone asks for (#334)", () => {
  it("names the member who asked, on the trip they asked about", async () => {
    const url = await webPort.calendarFeedUrl(world.member, world.ours.id);
    const token = url.match(/\/calendar\/(.+)\.ics$/)?.[1] ?? "";
    expect(readCalendarToken(token)).toEqual({ tripId: world.ours.id, userId: world.member });
  });

  it("is never minted for someone not on the trip", async () => {
    await expect(webPort.calendarFeedUrl(world.outsider, world.ours.id)).rejects.toThrow();
  });
});
