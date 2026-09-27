import { describe, expect, it } from "vitest";

import { routeCrop } from "./route-crop";

const BOX = { width: 424, height: 190, pad: 34 };
const JAPAN = [
  { lat: 35.676, lng: 139.65 },
  { lat: 35.233, lng: 139.107 },
  { lat: 35.011, lng: 135.768 },
  { lat: 34.694, lng: 135.502 },
];
const VIETNAM = [
  { lat: 21.028, lng: 105.804 },
  { lat: 20.79, lng: 107.09 },
  { lat: 15.88, lng: 108.338 },
  { lat: 10.823, lng: 106.629 },
  { lat: 10.036, lng: 105.788 },
];
const NEW_ZEALAND = [
  { lat: -43.532, lng: 172.636 },
  { lat: -43.389, lng: 170.183 },
  { lat: -44.7, lng: 169.144 },
  { lat: -45.031, lng: 168.662 },
  { lat: -45.414, lng: 167.718 },
  { lat: -43.595, lng: 170.142 },
];

describe("routeCrop", () => {
  it("picks the closest zoom that keeps every stop inside the padding", () => {
    const crop = routeCrop(JAPAN, BOX);
    expect(crop.zoom).toBe(6);
    for (const [x, y] of crop.points) {
      expect(x).toBeGreaterThanOrEqual(BOX.pad - 0.5);
      expect(x).toBeLessThanOrEqual(BOX.width - BOX.pad + 0.5);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(BOX.height);
    }
  });

  it("gives a tall route less margin top and bottom, so it earns a zoom level", () => {
    expect(routeCrop(VIETNAM, BOX).zoom).toBe(4);
  });

  it("keeps full margins on a wide route", () => {
    expect(routeCrop(NEW_ZEALAND, BOX).zoom).toBe(5);
  });

  it("centres the route in the box", () => {
    const { points } = routeCrop(JAPAN, BOX);
    const xs = points.map((p) => p[0]);
    expect((Math.min(...xs) + Math.max(...xs)) / 2).toBeCloseTo(BOX.width / 2, 5);
  });

  it("covers the whole box with tiles", () => {
    const { tiles } = routeCrop(JAPAN, BOX);
    const covered = (x: number, y: number) =>
      tiles.some((t) => x >= t.left && x < t.left + 256 && y >= t.top && y < t.top + 256);
    expect([covered(0, 0), covered(BOX.width - 1, 0), covered(0, BOX.height - 1), covered(BOX.width - 1, BOX.height - 1)]).toEqual([
      true,
      true,
      true,
      true,
    ]);
  });

  it("wraps tile columns across the date line", () => {
    const { zoom, tiles } = routeCrop([{ lat: 0, lng: 179.99 }], BOX);
    for (const t of tiles) {
      expect(t.x).toBeGreaterThanOrEqual(0);
      expect(t.x).toBeLessThan(2 ** zoom);
    }
  });
});
