import { describe, expect, it } from "vitest";

import { routeLines, stopRoles } from "./route-lines";

const lisbon = { place: "Lisbon, Portugal", lat: 38.72, lng: -9.14, nights: 3 };
const lagos = { place: "Lagos, Portugal", lat: 37.1, lng: -8.67, nights: 4 };
const seville = { place: "Seville, Spain", lat: 37.39, lng: -5.98, nights: 2 };

const close = (a: number[], b: number[]) => {
  expect(a[0]).toBeCloseTo(b[0], 6);
  expect(a[1]).toBeCloseTo(b[1], 6);
};

describe("routeLines", () => {
  it("draws one line a move, from each stop to the next, in [lng, lat]", () => {
    const lines = routeLines({ stops: [lisbon, lagos, seville], moves: [{ mode: "train", time: "" }, { mode: null, time: "Not set" }] });
    expect(lines).toHaveLength(2);
    close(lines[0].coords[0], [lisbon.lng, lisbon.lat]);
    close(lines[0].coords.at(-1)!, [lagos.lng, lagos.lat]);
    close(lines[1].coords.at(-1)!, [seville.lng, seville.lat]);
    expect(lines[1]).toMatchObject({ mode: null, time: "Not set" });
  });

  it("bows a flight off the straight line", () => {
    const [line] = routeLines({ stops: [lisbon, seville], moves: [{ mode: "flight", time: "1h" }] });
    const straightLat = (lisbon.lat + seville.lat) / 2;
    expect(Math.abs(line.mid[1] - straightLat)).toBeGreaterThan(0.3);
  });

  it("gives the way the line runs at its middle, on screen: east is 0°, south is 90°", () => {
    const east = routeLines({ stops: [lagos, { ...seville, lat: lagos.lat }], moves: [{ mode: "flight", time: "" }] })[0];
    expect(Math.abs(east.angle)).toBeLessThan(5);
    const south = routeLines({ stops: [lisbon, { ...lagos, lng: lisbon.lng }], moves: [{ mode: "flight", time: "" }] })[0];
    expect(south.angle).toBeGreaterThan(85);
    expect(south.angle).toBeLessThan(95);
  });

  it("pushes a leg's tag to the outside of its bend", () => {
    const [line] = routeLines({ stops: [lisbon, seville], moves: [{ mode: "flight", time: "" }] });
    const bowsSouth = line.mid[1] < (lisbon.lat + seville.lat) / 2;
    expect(Math.sign(line.bulge[1])).toBe(bowsSouth ? 1 : -1);
    expect(Math.hypot(...line.bulge)).toBeCloseTo(1, 6);
  });

  it("draws nothing for a single stop", () => {
    expect(routeLines({ stops: [lisbon], moves: [] })).toEqual([]);
  });
});

describe("stopRoles", () => {
  it("starts at the first stop and ends at the last", () => {
    expect(stopRoles([lisbon, lagos, seville])).toEqual([
      { role: "start", named: true },
      { role: "mid", named: true },
      { role: "end", named: true },
    ]);
  });

  it("starts and ends a round trip at the start, and names a place once", () => {
    expect(stopRoles([lisbon, lagos, lisbon])).toEqual([
      { role: "both", named: true },
      { role: "mid", named: true },
      { role: "mid", named: false },
    ]);
  });
});
