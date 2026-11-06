import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { migrateTestDb, resetDb, seedScenario, signIn, type Scenario } from "@/test/db";

const remove = vi.hoisted(() => vi.fn());
vi.mock("@/server/calendar/calendar-import", () => ({ removeCalendarAccess: remove }));

import { removeGoogleCalendar } from "./actions";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  signIn(world.member);
  remove.mockReset().mockResolvedValue(null);
});

describe("removeGoogleCalendar", () => {
  it("removes the signed-in member's own access", async () => {
    expect(await removeGoogleCalendar()).toEqual({});
    expect(remove).toHaveBeenCalledWith(world.member);
  });

  it("says why when Google could not be reached, and does not throw", async () => {
    remove.mockResolvedValue("Try again.");
    expect(await removeGoogleCalendar()).toEqual({ error: "Try again." });
  });
});
