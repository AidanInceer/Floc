import { describe, expect, it } from "vitest";

import { frameFor, homePiece } from "./frame";
import { landFrom } from "./land";

const square = (x: number, y: number, side: number) => [[x, y], [x + side, y], [x + side, y + side], [x, y + side], [x, y]];
const size = { width: 240, height: 170 };
const land = landFrom({
  features: [
    { id: "ES", geometry: { type: "Polygon", coordinates: [square(-9, 36, 8)] } },
    { id: "NZ", geometry: { type: "MultiPolygon", coordinates: [[square(172, -41, 4)], [square(166, -47, 6)]] } },
    { id: "CA", geometry: { type: "Polygon", coordinates: [square(-140, 42, 40)] } },
  ],
});

describe("homePiece", () => {
  it("is the piece of the country the first stop is on", () => {
    expect(homePiece(land, "NZ", { lat: -45, lng: 168.6 })?.box.west).toBe(166);
  });

  it("takes a stop just off the shore as on the piece", () => {
    expect(homePiece(land, "ES", { lat: 35.7, lng: -5 })?.code).toBe("ES");
  });

  it("is nothing when the country has no piece near the stop", () => {
    expect(homePiece(land, "FJ", { lat: -17, lng: 177 })).toBeUndefined();
  });
});

describe("frameFor", () => {
  it("shows the whole landmass when it fits, with the middle of the land in the middle of the drawing", () => {
    const frame = frameFor([{ lat: 37.4, lng: -6 }, { lat: 37.2, lng: -3.6 }], homePiece(land, "ES", { lat: 37.4, lng: -6 }), size);
    expect(frame.view.south).toBeLessThan(36);
    expect(frame.view.north).toBeGreaterThan(44);
    const mid = frame.point({ lat: 40, lng: -5 });
    expect(mid.x).toBeCloseTo(120);
    expect(mid.y).toBeCloseTo(85);
  });

  it("puts north at the top and east on the right", () => {
    const frame = frameFor([{ lat: 37.4, lng: -6 }], homePiece(land, "ES", { lat: 37.4, lng: -6 }), size);
    expect(frame.point({ lat: 43, lng: -5 }).y).toBeLessThan(frame.point({ lat: 37, lng: -5 }).y);
    expect(frame.point({ lat: 40, lng: -2 }).x).toBeGreaterThan(frame.point({ lat: 40, lng: -8 }).x);
  });

  it("looks at the route, eleven degrees high, when the landmass is too big to show", () => {
    const frame = frameFor([{ lat: 51.2, lng: -115.6 }, { lat: 52.9, lng: -118.1 }], homePiece(land, "CA", { lat: 51.2, lng: -115.6 }), size);
    expect(frame.view.north - frame.view.south).toBeCloseTo(11);
    expect((frame.view.north + frame.view.south) / 2).toBeCloseTo(52.05);
  });

  it("falls back to a small window on the route when the country has no outline", () => {
    const frame = frameFor([{ lat: -17, lng: 177 }], undefined, size);
    expect(frame.view.north - frame.view.south).toBeCloseTo(4.5);
  });

  it("widens for a route longer than the landmass frame, and keeps every stop off the edge", () => {
    const stops = [{ lat: 30, lng: -6 }, { lat: 52, lng: -4 }];
    const frame = frameFor(stops, homePiece(land, "ES", { lat: 37, lng: -6 }), size);
    for (const stop of stops) {
      const p = frame.point(stop);
      expect(p.y).toBeGreaterThan(10);
      expect(p.y).toBeLessThan(160);
    }
  });
});
