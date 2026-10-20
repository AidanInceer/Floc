import { describe, expect, it } from "vitest";

import { PRESET_TRIPS } from "../preset-trips";
import { monthsOf } from "./best-months";

describe("monthsOf", () => {
  it("reads a list of months", () => {
    expect(monthsOf("May, June, September")).toEqual([5, 6, 9]);
  });

  it("reads a range that wraps the year end", () => {
    expect(monthsOf("November to March")).toEqual([1, 2, 3, 11, 12]);
  });

  it("skips a word that is not a month", () => {
    expect(monthsOf("Spring, June")).toEqual([6]);
  });

  it("reads every listing to at least one month", () => {
    for (const t of PRESET_TRIPS) expect(monthsOf(t.bestMonths).length, t.id).toBeGreaterThan(0);
  });
});
