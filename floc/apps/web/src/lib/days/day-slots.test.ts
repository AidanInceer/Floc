import { describe, expect, it } from "vitest";

import { mergeSlots } from "./day-slots";

describe("mergeSlots", () => {
  it("shows a day in both views when it is in the week and beside the focus day", () => {
    expect(mergeSlots([0, 1, 2, 3, 4, 5, 6], [2, 3, 4])).toEqual([
      { index: 0, only: "wide" },
      { index: 1, only: "wide" },
      { index: 2 },
      { index: 3 },
      { index: 4 },
      { index: 5, only: "wide" },
      { index: 6, only: "wide" },
    ]);
  });

  it("keeps a neighbour from another week for the narrow view only", () => {
    expect(mergeSlots([7, 8, 9, 10, 11, 12, 13], [6, 7, 8])).toEqual([
      { index: 6, only: "narrow" },
      { index: 7 },
      { index: 8 },
      { index: 9, only: "wide" },
      { index: 10, only: "wide" },
      { index: 11, only: "wide" },
      { index: 12, only: "wide" },
      { index: 13, only: "wide" },
    ]);
  });
});
