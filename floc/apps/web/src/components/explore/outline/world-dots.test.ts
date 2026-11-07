import { describe, expect, it } from "vitest";

import type { Piece } from "./land";
import { worldDots } from "./world-dots";

// A square of land around Africa's middle, and nothing else.
const ring = [[0, -20], [40, -20], [40, 20], [0, 20], [0, -20]];
const LAND: Piece[] = [{ code: "XX", ring, box: { west: 0, south: -20, east: 40, north: 20 } }];

describe("worldDots", () => {
  it("puts dots only where there is land", () => {
    const dots = worldDots(LAND, 400, 160, 8);
    expect(dots.length).toBeGreaterThan(0);
    for (const d of dots) {
      expect(d.lng).toBeGreaterThanOrEqual(0);
      expect(d.lng).toBeLessThanOrEqual(40);
      expect(Math.abs(d.lat)).toBeLessThanOrEqual(20);
    }
  });

  it("keeps every dot inside the box", () => {
    for (const d of worldDots(LAND, 400, 160, 8)) {
      expect(d.x).toBeGreaterThan(0);
      expect(d.x).toBeLessThan(400);
      expect(d.y).toBeGreaterThan(0);
      expect(d.y).toBeLessThan(160);
    }
  });

  it("draws nothing before the land has loaded", () => {
    expect(worldDots([], 400, 160, 8)).toEqual([]);
  });

  it("draws nothing in an empty box", () => {
    expect(worldDots(LAND, 0, 0, 8)).toEqual([]);
  });
});
