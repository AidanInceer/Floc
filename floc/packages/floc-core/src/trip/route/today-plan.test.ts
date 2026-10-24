import { describe, expect, it } from "vitest";

import { todayPlan } from "./today-plan";

const trip = { startDate: "2026-09-01", endDate: "2026-09-07" };
const days = [
  { id: 1, date: "2026-09-01", events: [{ id: 10, title: "Arrive" }] },
  { id: 2, date: "2026-09-02", events: [{ id: 20, title: "Colosseum" }, { id: 21, title: "Dinner" }] },
];
const files = [
  { id: 100, dayId: 2, eventDayId: null },
  { id: 101, dayId: null, eventDayId: 2 },
  { id: 102, dayId: 1, eventDayId: null },
  { id: 103, dayId: null, eventDayId: null },
];

describe("the Today block (#329)", () => {
  it("is today's events in order and the files that sit on today", () => {
    const plan = todayPlan({ trip, days, files, today: "2026-09-02" });
    expect(plan?.date).toBe("2026-09-02");
    expect(plan?.events.map((e) => e.id)).toEqual([20, 21]);
    expect(plan?.files.map((f) => f.id)).toEqual([100, 101]);
  });

  it("is there, empty, on a trip day with nothing planned", () => {
    expect(todayPlan({ trip, days, files, today: "2026-09-05" })).toEqual({ date: "2026-09-05", events: [], files: [] });
  });

  it("is not there before the trip, after it, or on an undated trip", () => {
    expect(todayPlan({ trip, days, files, today: "2026-08-31" })).toBeNull();
    expect(todayPlan({ trip, days, files, today: "2026-09-08" })).toBeNull();
    expect(todayPlan({ trip: { startDate: null, endDate: null }, days, files, today: "2026-09-02" })).toBeNull();
  });
});
