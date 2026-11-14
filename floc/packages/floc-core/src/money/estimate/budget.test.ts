import { describe, expect, it } from "vitest";

import { budgetFit, lineProgress, totalRange } from "./budget";

describe("budgetFit", () => {
  it("says nothing without a budget", () => {
    expect(budgetFit(null, [82500, 135000])).toBeNull();
  });

  it("fits when the budget covers the top of the range", () => {
    expect(budgetFit(135000, [82500, 135000])).toEqual({ kind: "fits" });
  });

  it("is tight when it covers the low end only, and says how short the top is", () => {
    expect(budgetFit(110000, [82500, 135000])).toEqual({ kind: "tight", short: 25000 });
  });

  it("is over when even the low end is more than the budget", () => {
    expect(budgetFit(70000, [82500, 135000])).toEqual({ kind: "over", by: 12500 });
  });
});

describe("lineProgress", () => {
  it("has nothing to say about a line with no plan", () => {
    expect(lineProgress(0, null)).toEqual({ kind: "no-guide" });
  });

  it("is not started with nothing spent", () => {
    expect(lineProgress(0, [24000, 36000])).toEqual({ kind: "not-started" });
  });

  it("says what is left to go below the low end", () => {
    expect(lineProgress(9800, [31500, 49000])).toEqual({ kind: "to-go", range: [21700, 39200] });
  });

  it("is in range between the low and high end", () => {
    expect(lineProgress(14200, [11000, 19000])).toEqual({ kind: "in-range" });
  });

  it("is over past the high end", () => {
    expect(lineProgress(21000, [11000, 19000])).toEqual({ kind: "over", by: 2000 });
  });
});

describe("totalRange", () => {
  it("adds the lines that have a plan and skips the rest", () => {
    expect(totalRange([[100, 200], null, [50, 70]])).toEqual([150, 270]);
  });
});
