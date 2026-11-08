import { describe, expect, it } from "vitest";

import { tripBarStatus } from "./trip-bar-status";

const ended = { startDate: "2020-03-01", endDate: "2020-03-05" } as const;
const later = { startDate: "2099-03-01", endDate: "2099-03-05" } as const;

describe("tripBarStatus", () => {
  it("says a past trip has ended, not that it is archived", () => {
    expect(tripBarStatus(ended, false)).toBe("Ended");
  });

  it("counts down to a trip still being planned", () => {
    expect(tripBarStatus(later, false)).toMatch(/^in \d+ days$/);
  });

  it("leads the next trip with Next up", () => {
    expect(tripBarStatus(later, true)).toMatch(/^Next up · in \d+ days$/);
  });

  it("says planning for a trip with no dates", () => {
    expect(tripBarStatus({ startDate: null, endDate: null }, false)).toBe("Planning");
  });
});
