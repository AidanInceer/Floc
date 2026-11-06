/** The phone's way into the calendar import (#444): the same module as the web, behind the trip door. */
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";

const cal = vi.hoisted(() => ({
  enabled: vi.fn(),
  granted: vi.fn(),
  fill: vi.fn(),
  remove: vi.fn(),
}));
vi.mock("@/server/calendar/calendar-import", () => ({
  calendarEnabled: cal.enabled,
  hasCalendarAccess: cal.granted,
  fillFromCalendar: cal.fill,
  removeCalendarAccess: cal.remove,
}));

import { webPort } from "@/server/api-port/api-port";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  cal.enabled.mockReset().mockReturnValue(true);
  cal.granted.mockReset().mockResolvedValue(false);
  cal.fill.mockReset().mockResolvedValue({ status: "filled", free: 1, busy: 0 });
  cal.remove.mockReset().mockResolvedValue(null);
});

describe("calendar import on the port", () => {
  it("says whether it is offered and whether it was granted", async () => {
    expect(await webPort.calendarAccess(world.member)).toEqual({ enabled: true, granted: false });
    cal.enabled.mockReturnValue(false);
    expect((await webPort.calendarAccess(world.member)).enabled).toBe(false);
  });

  it("fills the viewer's own days on their trip", async () => {
    expect(await webPort.fillFromCalendar(world.member, world.ours.id, "2027-09")).toEqual({ status: "filled", free: 1, busy: 0 });
    expect(cal.fill).toHaveBeenCalledWith({ tripId: world.ours.id, userId: world.member, startDate: null, endDate: null, month: "2027-09" });
  });

  it("refuses a non-member before anything is read", async () => {
    await expect(webPort.fillFromCalendar(world.outsider, world.ours.id, "2027-09")).rejects.toThrow();
    expect(cal.fill).not.toHaveBeenCalled();
  });

  it("removes the viewer's access and passes a refusal through", async () => {
    expect(await webPort.removeCalendarAccess(world.member)).toBeNull();
    cal.remove.mockResolvedValue("Try again.");
    expect(await webPort.removeCalendarAccess(world.member)).toBe("Try again.");
  });
});
