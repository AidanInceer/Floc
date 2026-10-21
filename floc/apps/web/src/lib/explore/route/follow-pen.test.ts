import { describe, expect, it } from "vitest";

import { followPen, glideTo, markFade, penLook } from "./follow-pen";
import { plane } from "./glide";

const line = Array.from({ length: 11 }, (_, i) => ({ x: i * 100, y: 0 }));
const look = penLook(plane, line);
const from = { centre: { x: -3000, y: 0 }, w: 4000, at: { x: 0, y: 0 } };
const to = { centre: { x: 500, y: 0 }, w: 1200, at: { x: 400, y: 300 } };

describe("penLook", () => {
  it("follows the pen, smoothed, from the start to the end", () => {
    expect(look(0.5).x).toBeCloseTo(500);
    expect(look(0).x).toBeLessThan(look(0.2).x);
    expect(look(1).x).toBeGreaterThan(look(0.8).x);
  });

  it("holds still on a route that does not move", () => {
    const still = penLook(plane, [{ x: 3, y: 3 }, { x: 3, y: 3 }]);
    expect(still(0.4)).toEqual({ x: 3, y: 3 });
  });
});

describe("followPen", () => {
  const run = followPen(plane, { from, to, look, length: 900 });

  it("starts where the map was and ends on the whole trip", () => {
    expect(run.pose(0).centre.x).toBeCloseTo(-3000);
    expect(run.pose(run.ms).centre.x).toBeCloseTo(500);
    expect(run.pose(run.ms).w).toBeCloseTo(1200);
    expect(run.pose(run.ms).at).toEqual(to.at);
  });

  it("draws nothing at first and the whole route by the end", () => {
    expect(run.drawn(0)).toBe(0);
    expect(run.drawn(run.ms)).toBe(1);
  });

  it("keeps the camera on the pen, closer in, while it draws", () => {
    const t = run.passes(0.5);
    expect(run.drawn(t)).toBeCloseTo(0.5);
    expect(run.pose(t).centre.x).toBeCloseTo(look(0.5).x);
    expect(run.pose(t).w).toBeCloseTo(1200 / 2.1);
  });

  it("knows when the pen passes each point", () => {
    expect(run.passes(0)).toBeLessThan(run.passes(0.3));
    expect(run.drawn(run.passes(0.8))).toBeCloseTo(0.8);
  });

  it("rubs the old route out before it goes", () => {
    expect(run.old(0)).toBe(1);
    expect(run.old(run.passes(0))).toBe(0);
  });

  it("takes longer for a longer route, within limits", () => {
    expect(followPen(plane, { from, to, look, length: 1600 }).ms).toBeGreaterThan(run.ms);
    expect(followPen(plane, { from, to, look, length: 1e6 }).ms).toBe(followPen(plane, { from, to, look, length: 2e6 }).ms);
  });

  it("lets a click skip to the end", () => {
    expect(run.drawn(run.skip)).toBe(1);
    expect(run.pose(run.skip).w).toBeCloseTo(1200);
  });
});

describe("glideTo", () => {
  it("moves the map, and rubs out the route it leaves", () => {
    const back = glideTo(plane, to, from);
    expect(back.pose(0).centre.x).toBeCloseTo(500);
    expect(back.pose(back.ms).w).toBeCloseTo(4000);
    expect(back.old(0)).toBe(1);
    expect(back.old(back.ms)).toBe(0);
    expect(back.drawn(back.ms)).toBe(0);
  });
});

describe("markFade", () => {
  const passes = { passes: (at: number) => at * 1000 };

  it("hides a mark until the pen reaches it", () => {
    expect(markFade(passes, 400)(0.5)).toBe(0);
  });

  it("fades a mark in over the 300 ms after the pen passes it", () => {
    const half = markFade(passes, 650)(0.5);
    expect(half).toBeGreaterThan(0.5);
    expect(half).toBeLessThan(1);
    expect(markFade(passes, 800)(0.5)).toBe(1);
  });
});
