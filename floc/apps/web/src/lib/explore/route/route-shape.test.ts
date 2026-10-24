import { describe, expect, it } from "vitest";

import { ONE_STOP, RAIL, ROUND } from "@/test/route-listings";

import { cut, penPoints, routeShape } from "./route-shape";
import { tripRoute, type TripRoute } from "./trip-route";

const LISTINGS = { RAIL, ONE_STOP, ROUND };
const trip = (name: keyof typeof LISTINGS) => tripRoute(LISTINGS[name]);
// A flat stand-in for a map: a degree is 20px.
const at = ({ lat, lng }: { lat: number; lng: number }) => ({ x: lng * 20, y: -lat * 20 });
const OPTS = { samples: 20, out: 30, least: 50 };

describe("routeShape", () => {
  it("cuts the route into legs that run end to end, 0 to 1", () => {
    const shape = routeShape(trip("RAIL"), at, OPTS);
    expect(shape.pieces.map((p) => p.kind)).toEqual(["leg", "leg", "leg"]);
    expect(shape.pieces[0]!.a).toBe(0);
    expect(shape.pieces.at(-1)!.b).toBeCloseTo(1);
    shape.pieces.slice(1).forEach((p, k) => expect(p.a).toBeCloseTo(shape.pieces[k]!.b));
  });

  it("says when the pen reaches each stop", () => {
    const shape = routeShape(trip("RAIL"), at, OPTS);
    expect(shape.stops.map((s) => s.arrive)).toEqual([0, shape.pieces[0]!.b, shape.pieces[1]!.b, shape.pieces[2]!.b]);
  });

  it("marks the first stop as the start and the last as the end", () => {
    const shape = routeShape(trip("RAIL"), at, OPTS);
    expect(shape.stops.map((s) => s.role)).toEqual(["start", "mid", "mid", "end"]);
    expect(shape.stops.every((s) => s.named)).toBe(true);
  });

  it("carries each stop's nights to its name", () => {
    expect(routeShape(trip("ROUND"), at, OPTS).stops.map((s) => s.nights)).toEqual([2, 4, 3]);
  });

  it("names a place the route comes back to once, and a round trip as start and end", () => {
    const shape = routeShape(trip("ROUND"), at, OPTS);
    expect(shape.stops[0]!.role).toBe("both");
    expect(shape.stops.at(-1)!.named).toBe(false);
  });

  it("draws a group's own route, which lists no day outs, as legs only", () => {
    const { stops, moves } = trip("RAIL");
    expect(routeShape({ stops, moves }, at, OPTS).pieces.map((p) => p.kind)).toEqual(["leg", "leg", "leg"]);
  });

  it("draws a day out as a spur from its stop and back", () => {
    const shape = routeShape(trip("ONE_STOP"), at, OPTS);
    expect(shape.pieces).toHaveLength(1);
    const [out] = shape.pieces;
    expect(out!.kind).toBe("out");
    expect(out!.name).toBe("Positano, Amalfi, Capri");
    expect(out!.px[0]).toEqual(shape.stops[0]!.px);
    expect(out!.mark).toBeNull();
    expect(shape.stops[0]!.role).toBe("both");
  });

  it("puts a day out after its stop and before the leg that leaves it", () => {
    const route: TripRoute = {
      stops: [{ place: "A", lat: 0, lng: 0 }, { place: "B", lat: 0, lng: 10 }],
      moves: [{ mode: "car", time: "2h" }],
      outs: [{ at: 0, place: "C", mode: "ferry" }],
    };
    expect(routeShape(route, at, OPTS).pieces.map((p) => p.kind)).toEqual(["out", "leg"]);
  });

  it("gives a leg its mark only when it is long enough to hold it", () => {
    const route: TripRoute = {
      stops: [{ place: "A", lat: 0, lng: 0 }, { place: "B", lat: 0, lng: 1 }, { place: "C", lat: 0, lng: 6 }, { place: "D", lat: 0, lng: 30 }],
      moves: [{ mode: "car", time: "1h" }, { mode: "train", time: "a long time" }, null],
      outs: [],
    };
    expect(routeShape(route, at, OPTS).pieces.map((p) => p.mark)).toEqual([null, "icon", null]);
  });

  it("writes the words on a leg with no way to travel set, never a bare mark", () => {
    const route: TripRoute = {
      stops: [{ place: "A", lat: 0, lng: 0 }, { place: "B", lat: 0, lng: 6 }, { place: "C", lat: 0, lng: 6.5 }],
      moves: [{ mode: null, time: "Not set" }, { mode: null, time: "Not set" }],
      outs: [],
    };
    const shape = routeShape(route, at, OPTS);
    expect(shape.pieces.map((p) => p.mark)).toEqual(["full", null]);
  });

  it("shows only the mode on a leg with no time to write", () => {
    const route: TripRoute = {
      stops: [{ place: "A", lat: 0, lng: 0 }, { place: "B", lat: 0, lng: 10 }],
      moves: [{ mode: "car", time: "" }],
      outs: [],
    };
    expect(routeShape(route, at, OPTS).pieces[0]!.mark).toBe("icon");
  });

  it("finds the outside of each bend, for the mark to sit on", () => {
    const shape = routeShape(trip("RAIL"), at, OPTS);
    for (const p of shape.pieces) expect(Math.hypot(p.bulge.x, p.bulge.y)).toBeCloseTo(1);
  });

  it("sends a day out away from the rest of the trip", () => {
    const route: TripRoute = {
      stops: [{ place: "A", lat: 0, lng: 0 }, { place: "B", lat: 0, lng: 10 }],
      moves: [{ mode: "car", time: "2h" }],
      outs: [{ at: 1, place: "C", mode: "car" }],
    };
    const out = routeShape(route, at, OPTS).pieces[1]!;
    expect(out.px[Math.floor(out.px.length / 2)]!.x).toBeGreaterThan(200);
  });
});

describe("cut", () => {
  const pts = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 20, y: 0 }];
  const cum = [0, 10, 20];

  it("keeps the line up to the fraction asked", () => {
    expect(cut(pts, cum, 0.75)).toEqual([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 15, y: 0 }]);
  });

  it("keeps all of it at 1, and only the start at 0", () => {
    expect(cut(pts, cum, 1)).toBe(pts);
    expect(cut(pts, cum, 0)).toEqual([{ x: 0, y: 0 }, { x: 0, y: 0 }]);
  });
});

describe("penPoints", () => {
  it("walks the whole route at even steps of the pen", () => {
    const shape = routeShape(trip("RAIL"), at, OPTS);
    const pts = penPoints(shape, 10);
    expect(pts).toHaveLength(11);
    expect(pts[0]).toEqual(shape.stops[0]!.px);
    expect(pts[10]!.x).toBeCloseTo(shape.stops.at(-1)!.px.x);
  });

  it("stands still on a route with no line", () => {
    const shape = routeShape({ stops: [{ place: "A", lat: 1, lng: 1 }], moves: [], outs: [] }, at, OPTS);
    expect(penPoints(shape, 4)).toEqual(Array(5).fill(shape.stops[0]!.px));
  });
});
