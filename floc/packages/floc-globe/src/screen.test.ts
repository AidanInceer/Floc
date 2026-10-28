import { describe, expect, it } from "vitest";

import { aimAt, keepIn, placeAt, spotOf } from "./screen";

const FIT = { R: 400, cx: 500, cy: 420 };
const VIEW = { lat: 10, lng: 0 };

describe("spotOf and placeAt", () => {
  it("are each other the other way round", () => {
    const paris = { lat: 48.9, lng: 2.35 };
    const spot = spotOf(VIEW, FIT, paris);
    expect(spot.front).toBe(true);
    const back = placeAt(VIEW, FIT, spot)!;
    expect(back.lat).toBeCloseTo(paris.lat, 4);
    expect(back.lng).toBeCloseTo(paris.lng, 4);
  });

  it("puts the view's own place at the sphere's middle", () => {
    expect(spotOf(VIEW, FIT, VIEW)).toEqual({ x: 500, y: 420, front: true });
  });

  it("says when a place is round the back", () => {
    expect(spotOf(VIEW, FIT, { lat: -10, lng: 180 }).front).toBe(false);
  });

  it("finds no place off the edge of the sphere", () => {
    expect(placeAt(VIEW, FIT, { x: 0, y: 0 })).toBeNull();
  });
});

describe("aimAt", () => {
  it("turns the globe until a place sits at a point on the screen", () => {
    const tokyo = { lat: 35.7, lng: 139.7 };
    const view = aimAt(VIEW, FIT, tokyo, { x: 520, y: 200 });
    const spot = spotOf(view, FIT, tokyo);
    expect(spot.front).toBe(true);
    expect(spot.x).toBeCloseTo(520, 0);
    expect(spot.y).toBeCloseTo(200, 0);
  });

  it("never tips the globe past 70 degrees north or south", () => {
    expect(Math.abs(aimAt(VIEW, FIT, { lat: 80, lng: 0 }, { x: 500, y: 800 }).lat)).toBeLessThanOrEqual(70);
  });
});

describe("keepIn", () => {
  it("leaves a spot well inside alone", () => {
    expect(keepIn({ x: 300, y: 200 }, { w: 600, h: 400 }, { w: 120, h: 30 })).toEqual({ x: 300, y: 200 });
  });

  it("pulls a bubble in from the sides and down from the top", () => {
    expect(keepIn({ x: 10, y: 5 }, { w: 600, h: 400 }, { w: 120, h: 30 })).toEqual({ x: 68, y: 50 });
    expect(keepIn({ x: 590, y: 200 }, { w: 600, h: 400 }, { w: 120, h: 30 })).toEqual({ x: 532, y: 200 });
  });
});
