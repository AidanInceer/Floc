import { describe, expect, it } from "vitest";

import { slotIndices, tradeFor, tradeTracks } from "./column-trade";

describe("tradeFor", () => {
  it("trades a step to the day after across four slots, leaving one and arriving one", () => {
    expect(tradeFor(2, 3)).toEqual({ dir: 1, indices: [1, 2, 3, 4] });
  });

  it("trades a step to the day before across the same four slots, the other way", () => {
    expect(tradeFor(3, 2)).toEqual({ dir: -1, indices: [1, 2, 3, 4] });
  });

  it("does not trade a jump of more than one day", () => {
    expect(tradeFor(1, 4)).toBeNull();
  });

  it("does not trade when the day stays the same", () => {
    expect(tradeFor(2, 2)).toBeNull();
  });
});

describe("tradeTracks", () => {
  it("going on, the old day narrows to the left and the day after widens into the middle", () => {
    expect(tradeTracks(1, 600)).toEqual({
      before: "var(--days-side) 600px var(--days-side) 0px",
      after: "0px var(--days-side) 600px var(--days-side)",
    });
  });

  it("going back, the day before widens into the middle and the far side leaves on the right", () => {
    expect(tradeTracks(-1, 600)).toEqual({
      before: "0px var(--days-side) 600px var(--days-side)",
      after: "var(--days-side) 600px var(--days-side) 0px",
    });
  });
});

describe("slotIndices", () => {
  it("is the day before, the day and the day after when nothing is moving", () => {
    expect(slotIndices(4, null)).toEqual([3, 4, 5]);
  });

  it("is the four days of a trade while it plays", () => {
    expect(slotIndices(3, { dir: 1, indices: [1, 2, 3, 4] })).toEqual([1, 2, 3, 4]);
  });
});
