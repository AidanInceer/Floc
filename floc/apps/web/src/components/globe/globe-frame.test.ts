import { describe, expect, it } from "vitest";

import { globeFrame } from "./globe-frame";

describe("globeFrame", () => {
  it("centres the globe 2px inside the shorter side", () => {
    expect(globeFrame({ w: 300, h: 200 })).toEqual({ R: 98, cx: 150, cy: 100 });
  });

  it("never gives a negative radius while the canvas has no size", () => {
    expect(globeFrame({ w: 0, h: 0 }).R).toBe(0);
  });

  it("clamps a fitted frame too", () => {
    expect(globeFrame({ w: 0, h: 0 }, () => ({ R: -5, cx: 0, cy: 0 })).R).toBe(0);
  });
});
