import { describe, expect, it } from "vitest";

import { stepSlide, swipeStep, wipeOrigin, wipeReach } from "./tour";

describe("stepSlide", () => {
  it("moves one slide either way", () => {
    expect(stepSlide(2, 1, 7)).toBe(3);
    expect(stepSlide(2, -1, 7)).toBe(1);
  });

  it("wraps past either end", () => {
    expect(stepSlide(6, 1, 7)).toBe(0);
    expect(stepSlide(0, -1, 7)).toBe(6);
  });
});

describe("swipeStep", () => {
  it("steps forward on a swipe left and back on a swipe right", () => {
    expect(swipeStep(-80, 5)).toBe(1);
    expect(swipeStep(80, 5)).toBe(-1);
  });

  it("ignores a short move", () => {
    expect(swipeStep(-30, 0)).toBe(0);
  });

  it("ignores a mostly vertical move, which is a scroll", () => {
    expect(swipeStep(-60, 55)).toBe(0);
  });
});

describe("wipeOrigin", () => {
  const stage = { left: 100, top: 200, width: 1000, height: 500 };

  it("starts at the centre of the control that was pressed", () => {
    expect(wipeOrigin(stage, { left: 560, top: 740, width: 40, height: 40 })).toEqual({ x: 480, y: 560 });
  });

  it("starts at the foot of the stage when no control was pressed", () => {
    expect(wipeOrigin(stage, null)).toEqual({ x: 500, y: 500 });
  });
});

describe("wipeReach", () => {
  it("reaches the farthest corner, with a margin", () => {
    expect(wipeReach({ x: 0, y: 0 }, { width: 300, height: 400 })).toBeCloseTo(500 + 40);
  });

  it("covers the stage from a point below it", () => {
    const reach = wipeReach({ x: 500, y: 560 }, { width: 1000, height: 500 });
    expect(reach).toBeGreaterThan(Math.hypot(500, 560));
  });
});
