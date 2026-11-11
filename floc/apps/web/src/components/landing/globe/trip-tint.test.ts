import { describe, expect, it } from "vitest";

import { liveTint, tripTint } from "./trip-tint";

const square = (x: number, y: number, side: number) => [[x, y], [x + side, y], [x + side, y + side], [x, y + side], [x, y]];
const piece = (code: string, x: number, y: number) => ({ code, ring: square(x, y, 4), box: { west: x, south: y, east: x + 4, north: y + 4 } });

describe("tripTint", () => {
  const za = piece("ZAF", 18, -34);
  const na = piece("NAM", 14, -24);
  const fr = piece("FRA", 0, 44);
  const route = { stops: [{ lat: -32, lng: 20 }, { lat: -22, lng: 16 }], moves: [null] };

  it("fills the countries the stops stand in, in the region's colour, as Explore does", () => {
    const tint = tripTint([za, na, fr], { place: "Nowhere", region: "Africa", route });
    expect(tint).toEqual({ rings: new Set([za.ring, na.ring]), tone: "yellow" });
  });

  it("fills nothing before the outline arrives", () => {
    expect(tripTint([], { place: "Nowhere", region: "Africa", route }).rings.size).toBe(0);
  });
});

describe("liveTint", () => {
  const late = { rings: new Set([[[0, 0]]]), tone: "yellow" };

  it("fills the open trip at full strength while the layer fades in, so a stop change never flashes", () => {
    expect(liveTint({ rings: new Set(), tone: "yellow", alpha: 0.4 }, late)).toEqual({ ...late, alpha: 1 });
  });

  it("fills the open trip during the way in, before the layer draws a tint", () => {
    expect(liveTint(undefined, late)).toEqual({ ...late, alpha: 1 });
  });

  it("leaves the fade out of a closed trip as the layer draws it", () => {
    const fading = { rings: new Set([[[1, 1]]]), tone: "red", alpha: 0.2 };
    expect(liveTint(fading, null)).toBe(fading);
  });

  it("draws no tint with no trip open", () => {
    expect(liveTint(undefined, null)).toBeUndefined();
  });
});
