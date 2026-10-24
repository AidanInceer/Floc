import { describe, expect, it } from "vitest";

import { dayLook, type DayContext } from "./day-look";

const ctx = (over: Partial<DayContext> = {}): DayContext => ({
  tab: "mine",
  tallies: { "2027-09-04": 4, "2027-09-05": 2, "2027-09-12": 1 },
  memberCount: 4,
  tripStart: "2027-09-04",
  tripEnd: "2027-09-11",
  now: "2027-08-23",
  isFree: (d) => d === "2027-09-05",
  picking: false,
  inPick: () => false,
  pending: () => false,
  hiOf: (d) => (d === "2027-09-05" ? { hi: 26, label: "Sunny spells" } : undefined),
  hourDay: null,
  ...over,
});

describe("dayLook", () => {
  it("draws the trip the same on every tab", () => {
    for (const tab of ["mine", "group", "trip", "forecast"] as const)
      expect(dayLook(ctx({ tab }), "2027-09-05").mark).toEqual({ kind: "trip" });
  });

  it("draws a some-free day with its step outside the trip", () => {
    expect(dayLook(ctx(), "2027-09-12").mark).toEqual({ kind: "some", step: 1 });
  });

  it("only shows the high on the forecast tab", () => {
    expect(dayLook(ctx(), "2027-09-05").hi).toBeUndefined();
    expect(dayLook(ctx({ tab: "forecast" }), "2027-09-05").hi).toBe(26);
  });

  it("strikes the trip days a new window would drop", () => {
    const picking = ctx({ tab: "trip", picking: true, inPick: (d) => d >= "2027-09-06" });
    expect(dayLook(picking, "2027-09-04").cut).toBe(true);
    expect(dayLook(picking, "2027-09-07").cut).toBe(false);
  });

  it("says the day in words, not just colour", () => {
    expect(dayLook(ctx({ tab: "forecast" }), "2027-09-05").label).toMatch(/2 of 4 free, you can do it, in the trip, Sunny spells, high 26°$/);
  });
});
