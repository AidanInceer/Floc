import { describe, expect, it } from "vitest";

import { dayMark, markKey, someFreeStep, weekJoins, type DayMarkInput } from "./day-marks";

const day = (over: Partial<DayMarkInput> = {}): DayMarkInput => ({
  tally: 0,
  memberCount: 4,
  inTrip: false,
  picking: false,
  inPick: false,
  pending: false,
  ...over,
});

describe("someFreeStep", () => {
  it("gives a group of four one step per extra person", () => {
    expect([1, 2, 3].map((n) => someFreeStep(n, 4))).toEqual([1, 2, 3]);
  });

  it("keeps three steps for a large group", () => {
    expect([1, 3, 4, 6, 7, 9].map((n) => someFreeStep(n, 10))).toEqual([1, 1, 2, 2, 3, 3]);
  });

  it("puts one of two at the middle step", () => {
    expect(someFreeStep(1, 2)).toBe(2);
  });
});

describe("dayMark", () => {
  it("leaves a day nobody marked plain", () => {
    expect(dayMark(day())).toEqual({ kind: "none" });
  });

  it("marks a day the whole group can do", () => {
    expect(dayMark(day({ tally: 4 }))).toEqual({ kind: "all" });
  });

  it("marks a day some can do, with its step", () => {
    expect(dayMark(day({ tally: 2 }))).toEqual({ kind: "some", step: 2 });
  });

  it("lets the trip win over the group's answer", () => {
    expect(dayMark(day({ tally: 1, inTrip: true }))).toEqual({ kind: "trip" });
  });

  it("draws the window being picked as the trip, not the stored one", () => {
    expect(dayMark(day({ tally: 4, inTrip: true, picking: true }))).toEqual({ kind: "all" });
    expect(dayMark(day({ picking: true, inPick: true }))).toEqual({ kind: "trip" });
  });

  it("draws the span a second press would make as pending", () => {
    expect(dayMark(day({ picking: true, pending: true }))).toEqual({ kind: "pend" });
  });
});

describe("weekJoins", () => {
  it("joins a run of the same mark and leaves its ends round", () => {
    const keys = ["trip", "trip", "trip", "", "some-1", "some-2", "some-2"];
    expect(weekJoins(keys)).toEqual([
      { left: false, right: true },
      { left: true, right: true },
      { left: true, right: false },
      { left: false, right: false },
      { left: false, right: false },
      { left: false, right: true },
      { left: true, right: false },
    ]);
  });

  it("never joins across a padding day", () => {
    expect(weekJoins([null, "all", "all"])).toEqual([
      { left: false, right: false },
      { left: false, right: true },
      { left: true, right: false },
    ]);
  });

  it("keys a some-free day by its step, so different strengths stay apart", () => {
    expect(markKey({ kind: "some", step: 3 })).toBe("some-3");
    expect(markKey({ kind: "none" })).toBe("");
  });
});
