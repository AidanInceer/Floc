import { describe, expect, it } from "vitest";

import { landFrom, landFromPacked, onLand } from "./land";

const square = (x: number, y: number, side: number) => [[x, y], [x + side, y], [x + side, y + side], [x, y + side], [x, y]];

describe("landFrom", () => {
  it("reads a polygon as one piece, with its country code and its box", () => {
    const land = landFrom({ features: [{ id: "ES", geometry: { type: "Polygon", coordinates: [square(-9, 36, 8)] } }] });
    expect(land).toEqual([{ code: "ES", ring: square(-9, 36, 8), box: { west: -9, south: 36, east: -1, north: 44 } }]);
  });

  it("reads each part of a multi-polygon as its own piece", () => {
    const land = landFrom({ features: [{ id: "NZ", geometry: { type: "MultiPolygon", coordinates: [[square(172, -41, 4)], [square(166, -47, 6)]] } }] });
    expect(land.map((p) => p.code)).toEqual(["NZ", "NZ"]);
    expect(land[1]!.box).toEqual({ west: 166, south: -47, east: 172, north: -41 });
  });

  it("leaves out a country the file holds only as a point", () => {
    expect(landFrom({ features: [{ id: "MT", geometry: { type: "Point", coordinates: [14.4, 35.9] } }] })).toEqual([]);
  });
});

describe("landFromPacked", () => {
  it("reads each ring from its first point and the steps after it, in hundredths of a degree", () => {
    const land = landFromPacked({ ES: [[-900, 3600, 800, 0, 0, 800, -800, 0, 0, -800]] });
    expect(land).toEqual([{ code: "ES", ring: square(-9, 36, 8), box: { west: -9, south: 36, east: -1, north: 44 } }]);
  });

  it("reads each ring of a country as its own piece", () => {
    const land = landFromPacked({ NZ: [[17200, -4100, 400, 0, 0, 400, -400, 0, 0, -400], [16600, -4700, 600, 0, 0, 600, -600, 0, 0, -600]] });
    expect(land.map((p) => p.code)).toEqual(["NZ", "NZ"]);
    expect(land[1]!.box).toEqual({ west: 166, south: -47, east: 172, north: -41 });
  });
});

describe("onLand", () => {
  const land = landFrom({ features: [{ id: "ES", geometry: { type: "Polygon", coordinates: [square(-9, 36, 8)] } }] });

  it("is true for a stop inside a piece", () => {
    expect(onLand(land, { lat: 40, lng: -4 })).toBe(true);
  });

  it("is false for a stop in the sea", () => {
    expect(onLand(land, { lat: 40, lng: 3 })).toBe(false);
  });
});
