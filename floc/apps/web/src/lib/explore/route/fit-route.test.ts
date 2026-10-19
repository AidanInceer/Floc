import { describe, expect, it } from "vitest";

import { project } from "@/lib/landing/globe/sphere";
import { ONE_STOP, RAIL } from "@/test/route-listings";

import { fitRoute } from "./fit-route";
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

  it("looks at the middle of a one-stop trip", () => {
    const { view } = fitRoute(route("ONE_STOP"), BOX, ROOM, 3000);
    expect(view.lat).toBeCloseTo(40.611);
    expect(view.lng).toBeCloseTo(14.529);
  });
});
