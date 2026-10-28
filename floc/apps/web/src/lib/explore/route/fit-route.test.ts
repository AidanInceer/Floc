import { describe, expect, it } from "vitest";

import { project } from "@floc/globe/sphere";
import { ONE_STOP, RAIL } from "@/test/route-listings";

import { fitRoute, frameRoute } from "./fit-route";
import { tripRoute } from "./trip-route";

const LISTINGS = { RAIL, ONE_STOP };
const route = (name: keyof typeof LISTINGS) => tripRoute(LISTINGS[name]);
const BOX = { left: 0, top: 0, right: 800, bottom: 500 };
const ROOM = { x: 60, y: 40 };

describe("fitRoute", () => {
  it("fits every stop inside the box, clear of the room kept for names", () => {
    const rail = route("RAIL");
    const { view, R } = fitRoute(rail, BOX, ROOM, 1e6);
    for (const stop of rail.stops) {
      const q = project(view, stop);
      expect(Math.abs(q.x * R)).toBeLessThanOrEqual(400 - 60 + 0.5);
      expect(Math.abs(q.y * R)).toBeLessThanOrEqual(250 - 40 + 0.5);
    }
  });

  it("fills the box: the route reaches the edge on one side", () => {
    const rail = route("RAIL");
    const { view, R } = fitRoute(rail, BOX, ROOM, 1e6);
    const xs = rail.stops.map((s) => project(view, s).x * R);
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(560);
  });

  it("goes no closer than it is allowed", () => {
    expect(fitRoute(route("RAIL"), BOX, ROOM, 3000).R).toBe(3000);
    expect(fitRoute(route("ONE_STOP"), BOX, ROOM, 3000).R).toBe(3000);
  });

  it("never returns a negative radius when the box is smaller than the room", () => {
    const tiny = { left: 0, top: 0, right: 80, bottom: 50 };
    expect(fitRoute(route("ONE_STOP"), tiny, ROOM, 3000).R).toBeGreaterThan(0);
    expect(fitRoute(route("RAIL"), tiny, ROOM, 3000).R).toBeGreaterThan(0);
  });

  it("looks at the middle of a one-stop trip", () => {
    const { view } = fitRoute(route("ONE_STOP"), BOX, ROOM, 3000);
    expect(view.lat).toBeCloseTo(40.611);
    expect(view.lng).toBeCloseTo(14.529);
  });
});

describe("frameRoute", () => {
  const WIDE = { left: 0, top: 0, right: 900, bottom: 500 };
  const NARROW = { left: 0, top: 0, right: 400, bottom: 500 };

  it("puts the route's middle at the middle of the clear part", () => {
    const frame = frameRoute(route("RAIL"), WIDE);
    expect(frame.at(frame.view)).toEqual({ x: 450, y: 250 });
  });

  it("keeps the band's foot clear, raising the middle by half of it", () => {
    const frame = frameRoute(route("RAIL"), WIDE, 36);
    expect(frame.at(frame.view)).toEqual({ x: 450, y: 232 });
  });

  it("goes closer on a narrow screen than the wide room allows", () => {
    const one = route("ONE_STOP");
    expect(frameRoute(one, WIDE).R).toBe(9000);
    expect(frameRoute(one, NARROW).R).toBe(7000);
  });

  it("keeps every stop inside the clear part", () => {
    const rail = route("RAIL");
    const frame = frameRoute(rail, WIDE);
    for (const stop of rail.stops) {
      const p = frame.at(stop);
      expect(p.x).toBeGreaterThan(0);
      expect(p.x).toBeLessThan(900);
      expect(p.y).toBeGreaterThan(0);
      expect(p.y).toBeLessThan(500);
    }
  });
});
