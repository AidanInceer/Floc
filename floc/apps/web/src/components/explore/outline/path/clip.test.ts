import { describe, expect, it } from "vitest";

import { clipRing } from "./clip";

const view = { left: 0, top: 0, right: 10, bottom: 10 };

describe("clipRing", () => {
  it("leaves a ring inside the view as it is", () => {
    const ring = [{ x: 1, y: 1 }, { x: 9, y: 1 }, { x: 9, y: 9 }, { x: 1, y: 1 }];
    expect(clipRing(ring, view)).toEqual(ring);
  });

  it("cuts a ring that runs out of the view along the view's edge, and closes it", () => {
    const ring = [{ x: 5, y: 5 }, { x: 20, y: 5 }, { x: 20, y: 8 }, { x: 5, y: 8 }, { x: 5, y: 5 }];
    expect(clipRing(ring, view)).toEqual([{ x: 5, y: 5 }, { x: 10, y: 5 }, { x: 10, y: 8 }, { x: 5, y: 8 }, { x: 5, y: 5 }]);
  });

  it("is nothing for a ring wholly out of the view", () => {
    expect(clipRing([{ x: 20, y: 20 }, { x: 30, y: 20 }, { x: 30, y: 30 }, { x: 20, y: 20 }], view)).toEqual([]);
  });

  it("keeps the view's corner when land covers it", () => {
    const ring = [{ x: -5, y: -5 }, { x: 5, y: -5 }, { x: 5, y: 5 }, { x: -5, y: 5 }, { x: -5, y: -5 }];
    expect(clipRing(ring, view)).toContainEqual({ x: 0, y: 0 });
  });
});
