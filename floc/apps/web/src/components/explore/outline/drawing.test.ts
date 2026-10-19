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
const seville = { lat: 37.4, lng: -6 };
const granada = { lat: 37.2, lng: -3.6 };
const ES = new Set(["ES"]);

describe("drawOutline", () => {
  it("draws the trip's country apart from the land around it, and leaves out land that is off the drawing", () => {
    const d = drawOutline([seville, granada], ES, land, tile);
    expect(d.home).toMatch(/^M.*Z$/);
    expect(d.other).toMatch(/^M.*Z$/);
    expect(d.other.match(/Z/g)).toHaveLength(1);
  });

  it("fills every country the trip passes through", () => {
    const d = drawOutline([seville, granada], new Set(["ES", "PT"]), land, tile);
    expect(d.home.match(/Z/g)).toHaveLength(2);
    expect(d.other).toBe("");
  });

  it("gives a frame that puts the stops on the drawing, west to east", () => {
    const { frame } = drawOutline([seville, granada], ES, land, tile);
    const [a, b] = [frame!.point(seville), frame!.point(granada)];
    expect(a.x).toBeLessThan(b.x);
    for (const p of [a, b]) {
      expect(p.x).toBeGreaterThan(0);
      expect(p.x).toBeLessThan(tile.width);
    }
  });

  it("draws nothing for a trip with no stops", () => {
    expect(drawOutline([], ES, land, tile)).toEqual({ home: "", other: "", islets: [], frame: null });
  });

  it("puts a patch of land under a stop the coarse outline leaves in the sea", () => {
    const ibiza = { lat: 39, lng: 1.4 };
    const d = drawOutline([seville, ibiza], ES, land, tile);
    expect(d.islets).toHaveLength(1);
    expect(d.islets[0]!.x).toBeCloseTo(d.frame!.point(ibiza).x, 0);
  });

  it("puts no patch under a town on the shore, whose coast is already in reach of its mark", () => {
    const cadiz = { lat: 35.95, lng: -5 };
    expect(drawOutline([seville, cadiz], ES, land, tile).islets).toEqual([]);
  });

  it("still gives a frame when the outline has not loaded", () => {
    const d = drawOutline([seville, granada], ES, [], tile);
    expect(d.home).toBe("");
    expect(d.islets).toEqual([]);
    expect(d.frame).not.toBeNull();
  });
});
