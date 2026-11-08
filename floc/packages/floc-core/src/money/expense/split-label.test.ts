import { describe, expect, it } from "vitest";

import { splitLabel } from "./split-label";

const owes = (...amounts: number[]) => amounts.map((owedAmountMinor, i) => ({ userId: String(i), owedAmountMinor }));

describe("splitLabel", () => {
  it("calls a bill shared within a penny split evenly", () => {
    expect(splitLabel("shares", owes(334, 333, 333))).toBe("split evenly");
  });

  it("says by shares when the shares were uneven", () => {
    expect(splitLabel("shares", owes(667, 333))).toBe("by shares");
  });

  it("ignores nought rows, so a bill saved with them reads the same", () => {
    expect(splitLabel("shares", owes(500, 500, 0))).toBe("split evenly");
    expect(splitLabel("shares", owes(1000, 0))).toBe("all on one person");
  });

  it("keeps set amounts for an exact split", () => {
    expect(splitLabel("exact", owes(500, 500))).toBe("set amounts");
  });
});
