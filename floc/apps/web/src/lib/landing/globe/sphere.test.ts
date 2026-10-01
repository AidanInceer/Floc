import { describe, expect, it } from "vitest";

import { apart, faced, facing, greatCircle, limbRing, nearest, project, shortest, turn } from "./sphere";

const LONDON = { lat: 51.507, lng: -0.128 };
const TOKYO = { lat: 35.676, lng: 139.65 };

describe("shortest", () => {
  it("turns the short way round", () => {
    expect(shortest(350)).toBe(-10);
    expect(shortest(-190)).toBe(170);
    expect(shortest(20)).toBe(20);
  });
});

describe("project", () => {
  it("puts the place the view looks at in the middle, facing the viewer", () => {
    const at = project(TOKYO, TOKYO);
    expect(at.x).toBeCloseTo(0);
    expect(at.y).toBeCloseTo(0);
    expect(at.z).toBeCloseTo(1);
  });

  it("puts a place to the east on the right and one to the north above", () => {
    expect(project({ lat: 0, lng: 0 }, { lat: 0, lng: 30 }).x).toBeGreaterThan(0);
    expect(project({ lat: 0, lng: 0 }, { lat: 30, lng: 0 }).y).toBeGreaterThan(0);
  });

  it("pins a place on the far side to the edge", () => {
    const at = project({ lat: 0, lng: 0 }, { lat: 10, lng: 170 });
    expect(at.z).toBeLessThan(0);
    expect(Math.hypot(at.x, at.y)).toBeCloseTo(1);
  });
});

describe("greatCircle", () => {
  it("runs from one place to the other", () => {
    const path = greatCircle(LONDON, TOKYO, 10);
    expect(path).toHaveLength(11);
    expect(path[0]!.lat).toBeCloseTo(LONDON.lat);
    expect(path[10]!.lng).toBeCloseTo(TOKYO.lng);
  });

  it("goes north of both ends between London and Tokyo", () => {
    const mid = greatCircle(LONDON, TOKYO, 10)[5]!;
    expect(mid.lat).toBeGreaterThan(LONDON.lat);
  });
});

describe("apart", () => {
  it("is zero for one place and grows with distance", () => {
    expect(apart(LONDON, LONDON)).toBe(0);
    expect(apart(LONDON, TOKYO)).toBeGreaterThan(apart(LONDON, { lat: 37.389, lng: -5.984 }));
  });

  it("measures across the date line the short way", () => {
    expect(apart({ lat: 0, lng: 179 }, { lat: 0, lng: -179 })).toBeCloseTo(2);
  });
});

describe("facing", () => {
  it("keeps the view inside the band where the land reads well", () => {
    expect(facing({ lat: 80, lng: 0 }).lat).toBe(55);
    expect(facing({ lat: -80, lng: 0 }).lat).toBe(-50);
  });
});

describe("faced", () => {
  it("names the place a view was turned to", () => {
    const hanoi = { lat: 21.028, lng: 105.804 };
    const back = faced(facing(hanoi));
    expect(back.lat).toBeCloseTo(hanoi.lat);
    expect(back.lng).toBeCloseTo(hanoi.lng);
  });
});

describe("nearest", () => {
  it("names the place the globe is turned to", () => {
    const places = [TOKYO, LONDON];
    expect(nearest(facing(LONDON), places)).toBe(1);
    expect(nearest(facing(TOKYO), places)).toBe(0);
  });
});

describe("turn", () => {
  it("starts at one view and ends at the other", () => {
    const at = turn({ lat: 0, lng: 170 }, { lat: 20, lng: -170 });
    expect(at(0)).toEqual({ lat: 0, lng: 170 });
    expect(at(1)).toEqual({ lat: 20, lng: 190 });
  });

  it("adds whole turns for a spin", () => {
    expect(turn({ lat: 0, lng: 0 }, { lat: 0, lng: 10 }, 2)(1).lng).toBe(730);
  });
});

describe("limbRing", () => {
  const square = (lng: number) => [
    [lng - 5, -5],
    [lng + 5, -5],
    [lng + 5, 5],
    [lng - 5, 5],
  ];

  it("gives nothing for land on the far side", () => {
    expect(limbRing({ lat: 0, lng: 0 }, square(180))).toBeNull();
  });

  it("gives every point of land that faces the viewer", () => {
    const ring = limbRing({ lat: 0, lng: 0 }, square(0))!;
    expect(ring).toHaveLength(4);
    expect(ring.every((p) => "x" in p)).toBe(true);
  });

  it("closes land that crosses the edge along the edge", () => {
    const ring = limbRing({ lat: 0, lng: 0 }, square(90))!;
    const onEdge = ring.filter((p) => "a" in p);
    // Two crossings and the two hidden corners.
    expect(onEdge).toHaveLength(4);
    expect(ring.filter((p) => "x" in p)).toHaveLength(2);
  });
});
