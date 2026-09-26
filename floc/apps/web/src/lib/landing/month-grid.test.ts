import { describe, expect, it } from "vitest";

import { leadingBlanks } from "./month-grid";

describe("leadingBlanks", () => {
  it("counts the empty cells before the 1st in a Monday-first grid", () => {
    expect(leadingBlanks(2027, 9)).toBe(2);
  });

  it("is none when the month starts on a Monday", () => {
    expect(leadingBlanks(2027, 3)).toBe(0);
  });

  it("is six when the month starts on a Sunday", () => {
    expect(leadingBlanks(2027, 8)).toBe(6);
  });
});
