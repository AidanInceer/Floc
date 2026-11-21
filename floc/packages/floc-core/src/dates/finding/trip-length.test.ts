import { describe, expect, it } from "vitest";

import { isTripLength, lengthSummary, picksLength, type LengthChoice } from "./trip-length";

const choice = (userId: string, length: LengthChoice["length"]): LengthChoice => ({ userId, length });

describe("trip length", () => {
  it("says whether one person picked a length", () => {
    const choices = [choice("a", "week"), choice("b", "longer")];
    expect(picksLength(choices, "a", "week")).toBe(true);
    expect(picksLength(choices, "a", "longer")).toBe(false);
  });

  it("knows its own lengths from any other word", () => {
    expect(isTripLength("week")).toBe(true);
    expect(isTripLength("fortnight")).toBe(false);
  });

  it("says which length suits the most people", () => {
    const choices = [choice("a", "week"), choice("b", "week"), choice("b", "short_break"), choice("c", "week")];
    expect(lengthSummary(choices)).toBe("A week suits all 3.");
  });

  it("counts the people a length leaves out", () => {
    const choices = [choice("a", "week"), choice("b", "week"), choice("c", "long_weekend")];
    expect(lengthSummary(choices)).toBe("A week suits 2 of 3.");
  });

  it("says nothing until two people have answered", () => {
    expect(lengthSummary([])).toBe("");
    expect(lengthSummary([choice("a", "week")])).toBe("");
  });
});
