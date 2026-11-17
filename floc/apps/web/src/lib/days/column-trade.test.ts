import { describe, expect, it } from "vitest";

import { slotIndices, tradeFor, tradeTracks } from "./column-trade";

describe("tradeFor", () => {
  it("trades a step to the day after across four slots, leaving one and arriving one", () => {
    expect(tradeFor(2, 3)).toEqual({ from: 2, to: 3, indices: [1, 2, 3, 4] });
  });

  it("trades a step to the day before across the same four slots, the other way", () => {
    expect(tradeFor(3, 2)).toEqual({ from: 3, to: 2, indices: [1, 2, 3, 4] });
  });

  it("trades a jump of two days across the five days from the old side to the new side", () => {
    expect(tradeFor(1, 3)).toEqual({ from: 1, to: 3, indices: [0, 1, 2, 3, 4] });
  });

  it("trades a long jump across only the old day and the new day with their neighbours", () => {
    expect(tradeFor(1, 5)).toEqual({ from: 1, to: 5, indices: [0, 1, 2, 4, 5, 6] });
  });

  it("trades a long jump back with the same slots in day order", () => {
    expect(tradeFor(6, 0)).toEqual({ from: 6, to: 0, indices: [-1, 0, 1, 5, 6, 7] });
  });

  it("does not trade when the day stays the same", () => {
    expect(tradeFor(2, 2)).toBeNull();
  });
});

describe("tradeTracks", () => {
  it("going on, the old day narrows to the left and the day after widens into the middle", () => {
    expect(tradeTracks({ from: 2, to: 3, indices: [1, 2, 3, 4] }, 600)).toEqual({
      before: "var(--days-side) 600px var(--days-side) 0px",
      after: "0px var(--days-side) 600px var(--days-side)",
    });
  });

  it("going back, the day before widens into the middle and the far side leaves on the right", () => {
    expect(tradeTracks({ from: 3, to: 2, indices: [1, 2, 3, 4] }, 600)).toEqual({
      before: "0px var(--days-side) 600px var(--days-side)",
      after: "var(--days-side) 600px var(--days-side) 0px",
    });
  });

  it("on a jump of two, the day between stays a side day as the old day closes and the new day opens", () => {
    expect(tradeTracks({ from: 1, to: 3, indices: [0, 1, 2, 3, 4] }, 600)).toEqual({
      before: "var(--days-side) 600px var(--days-side) 0px 0px",
      after: "0px 0px var(--days-side) 600px var(--days-side)",
    });
  });

  it("on a long jump, the old three close up together as the new three open", () => {
    expect(tradeTracks({ from: 1, to: 5, indices: [0, 1, 2, 4, 5, 6] }, 600)).toEqual({
      before: "var(--days-side) 600px var(--days-side) 0px 0px 0px",
      after: "0px 0px 0px var(--days-side) 600px var(--days-side)",
    });
  });
});

describe("slotIndices", () => {
  it("is the day before, the day and the day after when nothing is moving", () => {
    expect(slotIndices(4, null)).toEqual([3, 4, 5]);
  });

  it("is every day of a trade while it plays", () => {
    expect(slotIndices(5, { from: 1, to: 5, indices: [0, 1, 2, 4, 5, 6] })).toEqual([0, 1, 2, 4, 5, 6]);
  });
});
