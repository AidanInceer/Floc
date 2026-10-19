import { describe, expect, it } from "vitest";

import { glide, plane, sphere } from "./glide";

const pose = (x: number, w: number) => ({ centre: { x, y: 0 }, w, at: { x: 100, y: 50 } });

describe("glide", () => {
  it("starts at one view and ends at the other", () => {
    const g = glide(plane, pose(0, 100), { centre: { x: 500, y: 0 }, w: 20, at: { x: 300, y: 80 } });
    expect(g.pose(0).centre.x).toBeCloseTo(0);
    expect(g.pose(0).w).toBeCloseTo(100);
    expect(g.pose(1).centre.x).toBeCloseTo(500);
    expect(g.pose(1).w).toBeCloseTo(20);
    expect(g.pose(1).at).toEqual({ x: 300, y: 80 });
  });

  it("pulls out on a long move, so the way between shows", () => {
    const g = glide(plane, pose(0, 20), pose(2000, 20));
    expect(g.pose(0.5).w).toBeGreaterThan(100);
  });

  it("only zooms when the place does not change", () => {
    const g = glide(plane, pose(0, 100), pose(0, 10));
    expect(g.pose(0.5).centre.x).toBe(0);
    expect(g.pose(0.5).w).toBeLessThan(100);
    expect(g.pose(0.5).w).toBeGreaterThan(10);
    expect(g.S).toBeGreaterThan(0);
  });

  it("takes longer for a longer move", () => {
    expect(glide(plane, pose(0, 20), pose(2000, 20)).S).toBeGreaterThan(glide(plane, pose(0, 20), pose(200, 20)).S);
  });
});

describe("spaces", () => {
  it("measures and mixes on a flat map", () => {
    expect(plane.apart({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    expect(plane.mix({ x: 0, y: 0 }, { x: 10, y: 20 }, 0.5)).toEqual({ x: 5, y: 10 });
    expect(plane.mean([{ x: 0, y: 0 }, { x: 4, y: 2 }])).toEqual({ x: 2, y: 1 });
  });

  it("measures and mixes on the globe, the short way round", () => {
    const [a, b] = [{ lat: 0, lng: 170 }, { lat: 0, lng: -170 }];
    expect(sphere.apart(a, b)).toBeCloseTo((20 * Math.PI) / 180);
    expect(Math.abs(sphere.mix(a, b, 0.5).lng)).toBeCloseTo(180);
    expect(sphere.mix(a, a, 0.3)).toEqual(a);
    expect(sphere.mean([{ lat: 10, lng: 0 }, { lat: -10, lng: 0 }]).lat).toBeCloseTo(0);
  });
});
