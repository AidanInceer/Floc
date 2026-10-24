import { describe, expect, it } from "vitest";

import { legCurves, spurCurve, type Point } from "./curves";

const off = (p: Point, a: Point, b: Point) => {
  const [dx, dy] = [b.x - a.x, b.y - a.y];
  return ((p.x - a.x) * dy - (p.y - a.y) * dx) / Math.hypot(dx, dy);
};
const heading = (a: Point, b: Point) => Math.atan2(b.y - a.y, b.x - a.x);

describe("legCurves", () => {
  const stops = [{ x: 0, y: 0 }, { x: 100, y: 10 }, { x: 200, y: 0 }];

  it("runs each leg from its stop to the next", () => {
    const legs = legCurves(stops, ["car", "car"], 20);
    expect(legs).toHaveLength(2);
    expect(legs[0]![0]).toEqual(stops[0]);
    expect(legs[0]!.at(-1)!.x).toBeCloseTo(100);
    expect(legs[1]!.at(-1)!.x).toBeCloseTo(200);
  });

  it("never draws a straight line between two stops", () => {
    const [leg] = legCurves([{ x: 0, y: 0 }, { x: 100, y: 0 }], ["car"], 20);
    expect(Math.max(...leg!.map((p) => Math.abs(p.y)))).toBeGreaterThan(4);
  });

  it("flows through a stop between two drives with no sharp corner", () => {
    const [a, b] = legCurves(stops, ["train", "car"], 40);
    const into = heading(a!.at(-2)!, a!.at(-1)!);
    const out = heading(b![0]!, b![1]!);
    expect(Math.abs(into - out)).toBeLessThan((22 * Math.PI) / 180);
  });

  it("bows a flight well off the straight line, away from the middle of the trip", () => {
    const route = [{ x: 0, y: 0 }, { x: 0, y: 100 }, { x: 200, y: 100 }];
    const [, flight] = legCurves(route, ["car", "flight"], 40);
    const most = Math.max(...flight!.map((p) => Math.abs(off(p, route[1]!, route[2]!))));
    expect(most).toBeGreaterThan(50);
    expect(flight![20]!.y).toBeGreaterThan(100);
  });

  it("bows a boat less than a flight", () => {
    const route = [{ x: 0, y: 0 }, { x: 200, y: 0 }];
    const peak = (mode: "ferry" | "flight") => Math.max(...legCurves(route, [mode], 40)[0]!.map((p) => Math.abs(p.y)));
    expect(peak("ferry")).toBeLessThan(peak("flight"));
  });

  it("treats an unknown move as a drive", () => {
    expect(legCurves(stops, [null, "car"], 10)).toEqual(legCurves(stops, ["car", "car"], 10));
  });

  it("keeps bending the same way across a leg that runs through the middle of the trip", () => {
    const zigzag = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 0, y: 1 }, { x: 100, y: 1 }];
    expect(legCurves(zigzag, ["car", "car", "car"], 10)).toHaveLength(3);
  });
});

describe("spurCurve", () => {
  it("leaves the stop and comes back to it", () => {
    const spur = spurCurve({ x: 10, y: 10 }, { x: 0, y: -1 }, 40, 24);
    expect(spur[0]).toEqual({ x: 10, y: 10 });
    expect(spur.at(-1)!.x).toBeCloseTo(10);
    expect(spur.at(-1)!.y).toBeCloseTo(10);
  });

  it("goes out and back on one straight line, as far as asked, its tip halfway", () => {
    const spur = spurCurve({ x: 0, y: 0 }, { x: 0, y: -1 }, 40, 24);
    for (const p of spur) expect(Math.abs(p.x)).toBeLessThan(1e-9);
    expect(spur[12]!.y).toBeCloseTo(-40);
  });
});
