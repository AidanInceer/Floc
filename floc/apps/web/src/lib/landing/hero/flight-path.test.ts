import { describe, expect, it } from "vitest";

import { flightPoint, TRAIL_D, TRAIL_H, TRAIL_W } from "./flight-path";

describe("flightPoint", () => {
  it("starts and ends off the edges, level with each other", () => {
    const start = flightPoint(0, 1000, 400);
    const end = flightPoint(1, 1000, 400);
    expect(start.x).toBeLessThan(0);
    expect(end.x).toBeGreaterThan(1000);
    expect(start.y).toBe(end.y);
  });

  it("peaks at the middle, flying level", () => {
    const mid = flightPoint(0.5, 1000, 400);
    expect(mid.x).toBeCloseTo(500);
    expect(mid.y).toBeLessThan(flightPoint(0.25, 1000, 400).y);
    expect(mid.angle).toBeCloseTo(0);
  });

  it("climbs on the way up and dives on the way down, by the same angle", () => {
    const up = flightPoint(0.1, 1600, 400).angle;
    const down = flightPoint(0.9, 1600, 400).angle;
    expect(up).toBeLessThan(0);
    expect(down).toBeCloseTo(-up);
  });

  it("scales to the box it is drawn in", () => {
    const small = flightPoint(0.3, TRAIL_W / 2, TRAIL_H / 2);
    const big = flightPoint(0.3, TRAIL_W, TRAIL_H);
    expect(big.x).toBeCloseTo(small.x * 2);
    expect(big.y).toBeCloseTo(small.y * 2);
  });

  it("points along the curve it follows", () => {
    const a = flightPoint(0.3, 1600, 400);
    const b = flightPoint(0.3001, 1600, 400);
    expect(a.angle).toBeCloseTo((Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI, 1);
  });

  it("draws the trail on the same curve", () => {
    expect(TRAIL_D).toMatch(/^M-?\d+ \d+ Q\d+ -?\d+ \d+ \d+$/);
  });
});
