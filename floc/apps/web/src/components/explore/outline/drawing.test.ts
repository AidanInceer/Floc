import { describe, expect, it } from "vitest";

import { drawOutline } from "./drawing";
import { landFrom } from "./land";

const square = (x: number, y: number, side: number) => [[x, y], [x + side, y], [x + side, y + side], [x, y + side], [x, y]];
const land = landFrom({
  features: [
    { id: "ES", geometry: { type: "Polygon", coordinates: [square(-9, 36, 8)] } },
    { id: "PT", geometry: { type: "Polygon", coordinates: [square(-12, 37, 3)] } },
    { id: "JP", geometry: { type: "Polygon", coordinates: [square(130, 30, 10)] } },
  ],
});
const tile = { width: 240, height: 170 };
const seville = { place: "Seville", lat: 37.4, lng: -6 };
const cordoba = { place: "Córdoba", lat: 37.9, lng: -4.8 };
const granada = { place: "Granada", lat: 37.2, lng: -3.6 };

describe("drawOutline", () => {
  it("draws the trip's country apart from the land around it, and leaves out land that is off the drawing", () => {
    const d = drawOutline([seville, granada], "ES", land, tile, false);
    expect(d.home).toMatch(/^M.*Z$/);
    expect(d.other).toMatch(/^M.*Z$/);
    expect(d.other.match(/Z/g)).toHaveLength(1);
  });

  it("pins each stop in the order it is visited and runs the route through them", () => {
    const d = drawOutline([seville, cordoba, granada], "ES", land, tile, false);
    expect(d.pins.map((p) => p.label)).toEqual(["1", "2", "3"]);
    expect(d.way.match(/L/g)).toHaveLength(2);
    expect(d.pins[0]!.x).toBeLessThan(d.pins[2]!.x);
  });

  it("gives one pin to a place the route comes back to", () => {
    const d = drawOutline([seville, granada, { ...seville }], "ES", land, tile, false);
    expect(d.pins.map((p) => p.label)).toEqual(["1·3", "2"]);
    expect(d.way.match(/L/g)).toHaveLength(2);
  });

  it("draws no route for a single stop", () => {
    expect(drawOutline([seville], "ES", land, tile, false).way).toBe("");
  });

  it("keeps pins that share a spot on the drawing from covering each other", () => {
    const d = drawOutline([seville, { place: "Triana", lat: 37.41, lng: -6.01 }], "ES", land, tile, false);
    expect(Math.hypot(d.pins[0]!.x - d.pins[1]!.x, d.pins[0]!.y - d.pins[1]!.y)).toBeGreaterThanOrEqual(9.5);
  });

  it("puts a patch of land under a stop the coarse outline leaves in the sea", () => {
    const d = drawOutline([seville, { place: "Ibiza", lat: 39, lng: 1.4 }], "ES", land, tile, false);
    expect(d.islets).toHaveLength(1);
    expect(d.islets[0]!.x).toBeCloseTo(d.pins[1]!.x);
  });

  it("names the stops only on the large drawing, each name inside the drawing", () => {
    expect(drawOutline([seville, granada], "ES", land, tile, false).names).toEqual([]);
    const size = { width: 432, height: 216 };
    const d = drawOutline([seville, cordoba, granada], "ES", land, size, true);
    expect(d.names.map((n) => n.text)).toEqual(["Seville", "Córdoba", "Granada"]);
    for (const n of d.names) {
      expect(n.x).toBeGreaterThan(0);
      expect(n.x).toBeLessThan(size.width);
      expect(n.y).toBeGreaterThan(0);
      expect(n.y).toBeLessThan(size.height);
    }
  });

  it("still draws the route when the outline has not loaded", () => {
    const d = drawOutline([seville, granada], "ES", [], tile, false);
    expect(d.home).toBe("");
    expect(d.pins).toHaveLength(2);
    expect(d.islets).toEqual([]);
  });
});
