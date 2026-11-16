import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { expectNotFound, migrateTestDb, resetDb, seedScenario, signIn, type Scenario } from "@/test/db";

const fill = vi.hoisted(() => vi.fn());
vi.mock("@/server/calendar/calendar-import", () => ({ fillFromCalendar: fill }));

import { calendarAllDayOnly } from "@/server/calendar/calendar-options";
import { fillFromGoogleCalendar, keepCalendarAllDayOnly } from "./actions";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  signIn(world.member);
  fill.mockReset().mockResolvedValue({ status: "filled", free: 2, busy: 1 });
});

describe("fillFromGoogleCalendar", () => {
  it("fills the viewer's own days on a trip they belong to", async () => {
    expect(await fillFromGoogleCalendar(world.ours.id, "2027-09")).toEqual({ status: "filled", free: 2, busy: 1 });
    expect(fill).toHaveBeenCalledWith({
      tripId: world.ours.id,
      userId: world.member,
      startDate: null,
      endDate: null,
      month: "2027-09",
    });
  });

  it("answers a non-member exactly as a trip that does not exist, and reads nothing", async () => {
    signIn(world.outsider);
    await expectNotFound(() => fillFromGoogleCalendar(world.ours.id, "2027-09"));
    expect(fill).not.toHaveBeenCalled();
  });

  it("hands a refusal back as a result", async () => {
    fill.mockResolvedValue({ status: "error", message: "Nope." });
    expect(await fillFromGoogleCalendar(world.ours.id, "2027-09")).toEqual({ status: "error", message: "Nope." });
  });
});

describe("keepCalendarAllDayOnly", () => {
  it("remembers the choice for the signed-in person only", async () => {
    await keepCalendarAllDayOnly(true);
    expect(await calendarAllDayOnly(world.member)).toBe(true);
    expect(await calendarAllDayOnly(world.admin)).toBe(false);
  });

  it("refuses anything but true or false", async () => {
    await expect(keepCalendarAllDayOnly("yes" as never)).rejects.toThrow();
    expect(await calendarAllDayOnly(world.member)).toBe(false);
  });
});
