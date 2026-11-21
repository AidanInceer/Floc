import { describe, expect, it } from "vitest";

import { ringPath } from "./ring-path";

const ring = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }, { x: 0, y: 0 }];

describe("ringPath", () => {
  it("draws nothing for a ring with no area", () => {
    expect(ringPath([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 0 }])).toBe("");
  });

  it("is one closed path with a curve at each corner", () => {
    const d = ringPath(ring);
    expect(d.startsWith("M")).toBe(true);
    expect(d.endsWith("Z")).toBe(true);
    expect(d.match(/Q/g)).toHaveLength(4);
  });

  it("eases a corner by a few pixels only, so a long border stays straight", () => {
    expect(ringPath(ring)).toContain("M0 5Q0 0 5 0L95 0Q100 0 100 5");
  });

  it("eases a short edge by half its length at most", () => {
    const d = ringPath([{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 100 }, { x: 0, y: 100 }, { x: 0, y: 0 }]);
    expect(d).toContain("Q0 0 2 0L2 0Q4 0");
  });
});
