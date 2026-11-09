import { describe, expect, it } from "vitest";

import { readFileSync } from "node:fs";

import { PRESET_TRIPS } from "@floc/core/trip/explore/preset-trips";

import { tripCodes } from "./country";
import { countryFrame, frameFor, homePiece } from "./frame";
import { landFrom, landFromPacked } from "./land";

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

  it("zooms in on stops that would sit almost on top of each other, so a line can be seen between them", () => {
    const stops = [{ lat: 40.2, lng: -5.9 }, { lat: 40.0, lng: -5.6 }];
    const frame = frameFor(stops, homePiece(land, "ES", stops[0]!), size);
    const [a, b] = stops.map(frame.point);
    expect(Math.hypot(a!.x - b!.x, a!.y - b!.y)).toBeGreaterThanOrEqual(size.height * 0.2 - 0.5);
    expect(frame.view.north - frame.view.south).toBeLessThan(8);
    expect(a!.y).toBeGreaterThan(size.height * 0.25);
    expect(a!.y).toBeLessThan(size.height * 0.75);
  });

  it("zooms no further than the whole route", () => {
    const stops = [{ lat: 40.2, lng: -5.9 }, { lat: 40.0, lng: -5.6 }, { lat: 42, lng: -3 }];
    const frame = frameFor(stops, homePiece(land, "ES", stops[0]!), size);
    for (const stop of stops) {
      const p = frame.point(stop);
      expect(p.x).toBeGreaterThan(0);
      expect(p.x).toBeLessThan(size.width);
      expect(p.y).toBeGreaterThan(0);
      expect(p.y).toBeLessThan(size.height);
    }
  });
});

describe("every listing", () => {
  const fine = landFromPacked(JSON.parse(readFileSync("public/land-50m.json", "utf8")));
  const SIZES = [{ width: 240, height: 170 }, { width: 432, height: 216 }];

  it("keeps its stops apart where the route is wide enough to allow it", () => {
    const tight: string[] = [];
    for (const trip of PRESET_TRIPS) {
      const stops = trip.legs.flatMap((l) => (l.kind === "base" ? [{ place: l.place, lat: l.lat, lng: l.lng }] : []));
      for (const box of SIZES) {
        const frame = frameFor(stops, homePiece(fine, [...tripCodes(trip.country, stops, fine)][0] ?? "", stops[0]!), box);
        const px = stops.map(frame.point);
        for (let i = 0; i < px.length; i++) {
          for (let j = i + 1; j < px.length; j++) {
            const apart = Math.hypot(px[i]!.x - px[j]!.x, px[i]!.y - px[j]!.y);
            const high = frame.view.north - frame.view.south;
            const wide = Math.max(Math.max(...stops.map((x) => x.lat)) - Math.min(...stops.map((x) => x.lat)), ((Math.max(...stops.map((x) => x.lng)) - Math.min(...stops.map((x) => x.lng))) * Math.cos((stops[0]!.lat * Math.PI) / 180)) / (box.width / box.height));
            const room = high > wide * 1.5 * 1.02 + 0.01;
            if (room && apart > 0.5 && apart < box.height * 0.17) tight.push(`${trip.id} ${stops[i]!.place}/${stops[j]!.place} ${Math.round(apart)}px in ${box.height}`);
          }
        }
      }
    }
    expect(tight).toEqual([]);
  });
});

describe("countryFrame", () => {
  const fine = landFromPacked(JSON.parse(readFileSync("public/land-50m.json", "utf8")));
  const inside = (outer: { west: number; south: number; east: number; north: number }, inner: typeof outer) =>
    inner.west >= outer.west && inner.east <= outer.east && inner.south >= outer.south && inner.north <= outer.north;

  it("fits a big country's whole mainland, so the tile shows its shape and not only its land", () => {
    const frame = countryFrame(fine, "AU", size)!;
    const mainland = fine.filter((p) => p.code === "AU").sort((a, b) => b.ring.length - a.ring.length)[0]!;
    expect(inside(frame.view, mainland.box)).toBe(true);
  });

  it("draws a small island big enough to see", () => {
    const frame = countryFrame(fine, "AW", size)!;
    const island = fine.find((p) => p.code === "AW")!;
    const top = frame.point({ lng: island.box.west, lat: island.box.north });
    const bottom = frame.point({ lng: island.box.east, lat: island.box.south });
    expect(bottom.y - top.y).toBeGreaterThan(size.height * 0.1);
  });

  it("keeps a country's other big islands in the frame: Hokkaido, the Malay peninsula, the North Island", () => {
    const sees = (code: string, spot: { lat: number; lng: number }) => {
      const { view } = countryFrame(fine, code, size)!;
      return spot.lat > view.south && spot.lat < view.north && spot.lng > view.west && spot.lng < view.east;
    };
    expect(sees("JP", { lat: 43.06, lng: 141.35 })).toBe(true);
    expect(sees("MY", { lat: 3.14, lng: 101.69 })).toBe(true);
    expect(sees("NZ", { lat: -36.85, lng: 174.76 })).toBe(true);
  });

  it("leaves out a far territory, so France is framed on France and not on French Guiana too", () => {
    const { view } = countryFrame(fine, "FR", size)!;
    expect(view.west).toBeGreaterThan(-20);
  });

  it("frames a country across the 180th meridian on its main land, not the whole world", () => {
    const { view } = countryFrame(fine, "RU", size)!;
    expect(view.east - view.west).toBeLessThan(180);
  });

  it("is nothing for a country with no outline", () => {
    expect(countryFrame(fine, "ZZ", size)).toBeNull();
  });
});
