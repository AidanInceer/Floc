import { describe, expect, it } from "vitest";

import { project } from "@/lib/landing/globe/sphere";

import { domeFit, fineAt, fitAt, legMarks, legPart, over, routeFit, viewFor } from "./dome";

const clear = { left: 52, top: 68, right: 800, bottom: 676 };

describe("over", () => {
  it("is the view that stands a place on the upper part of the dome, straight above the middle", () => {
    const tokyo = { lat: 35.7, lng: 139.7 };
    const seen = project(over(tokyo), tokyo);
    expect(seen.x).toBeCloseTo(0);
    expect(seen.y).toBeCloseTo(Math.sin((40 * Math.PI) / 180));
    expect(seen.z).toBeGreaterThan(0);
  });

  it("goes no further south than a drag can turn the globe", () => {
    expect(over({ lat: -45, lng: 168.7 })).toEqual({ lat: -70, lng: 168.7 });
  });
});

describe("domeFit", () => {
  it("makes the sphere wide enough that only its top shows, centred on the part the card leaves clear", () => {
    const fit = domeFit(1280, clear);
    expect(fit.R).toBeCloseTo(1280 * 0.42);
    expect(fit.cx).toBe(426);
    expect(fit.cy - fit.R).toBe(clear.top + 16);
  });

  it("keeps a dome a phone can read", () => {
    expect(domeFit(375, { left: 8, top: 68, right: 367, bottom: 388 }).R).toBe(250);
  });
});

describe("routeFit", () => {
  const stops = [{ lat: 37.4, lng: -6 }, { lat: 37.9, lng: -4.8 }, { lat: 37.2, lng: -3.6 }];

  it("looks at the middle of the route, with the sphere's middle in the middle of the clear part", () => {
    const { fit, view } = routeFit(stops, clear);
    expect(view.lat).toBeCloseTo(37.55);
    expect(view.lng).toBeCloseTo(-4.8);
    expect(fit.cx).toBe(426);
    expect(fit.cy).toBe(372);
  });

  it("zooms far enough in to tell the stops apart, and no further than the outline can carry", () => {
    expect(routeFit(stops, clear).fit.R).toBeGreaterThanOrEqual(1400);
    expect(routeFit([{ lat: 40.6, lng: 14.5 }], clear).fit.R).toBe(3200);
  });
});

describe("fitAt", () => {
  const from = { R: 500, cx: 400, cy: 600 };
  const to = { R: 2000, cx: 420, cy: 372 };

  it("is the dome at the start and the route at the end", () => {
    expect(fitAt(0, from, to)).toEqual(from);
    expect(fitAt(1, from, to)).toEqual(to);
  });

  it("grows by ratio, so the zoom reads as steady, and moves the middle in a straight line", () => {
    const half = fitAt(0.5, from, to);
    expect(half.R).toBeCloseTo(1000);
    expect(half.cx).toBe(410);
    expect(half.cy).toBe(486);
  });
});

describe("viewFor", () => {
  const fit = { R: 500, cx: 400, cy: 600 };
  const cairo = { lat: 30, lng: 31.2 };
  const seen = (view: { lat: number; lng: number }) => {
    const q = project(view, cairo);
    return { x: fit.cx + fit.R * q.x, y: fit.cy - fit.R * q.y, z: q.z };
  };

  it("is the place itself when the place must sit on the sphere's middle", () => {
    const view = viewFor(fit, cairo, { x: fit.cx, y: fit.cy });
    expect(view.lat).toBeCloseTo(30);
    expect(view.lng).toBeCloseTo(31.2);
  });

  it("puts the place at the point asked for, on the side of the globe that faces us", () => {
    const at = seen(viewFor(fit, cairo, { x: 520, y: 350 }));
    expect(at.x).toBeCloseTo(520);
    expect(at.y).toBeCloseTo(350);
    expect(at.z).toBeGreaterThan(0);
  });

  it("stops at the edge of the sphere when the point is off it", () => {
    const at = seen(viewFor(fit, cairo, { x: fit.cx, y: -400 }));
    expect(at.x).toBeCloseTo(400);
    expect(at.y).toBeCloseTo(100);
  });
});

describe("legMarks", () => {
  it("marks how far along the whole line each stop is, by distance and not by count", () => {
    const marks = legMarks([{ lat: 0, lng: 0 }, { lat: 0, lng: 1 }, { lat: 0, lng: 4 }]);
    expect(marks[0]).toBe(0);
    expect(marks[1]).toBeCloseTo(0.25);
    expect(marks[2]).toBe(1);
  });

  it("is one mark for a trip with one stop", () => {
    expect(legMarks([{ lat: 40.6, lng: 14.5 }])).toEqual([0]);
  });

  it("still ends at one when the route comes back to where it began", () => {
    const marks = legMarks([{ lat: 0, lng: 0 }, { lat: 0, lng: 2 }, { lat: 0, lng: 0 }]);
    expect(marks).toEqual([0, 0.5, 1]);
  });
});

describe("legPart", () => {
  const marks = [0, 0.25, 1];

  it("is how much of one leg the line has covered", () => {
    expect(legPart(0.125, marks, 0)).toBeCloseTo(0.5);
    expect(legPart(0.125, marks, 1)).toBe(0);
    expect(legPart(0.625, marks, 0)).toBe(1);
    expect(legPart(0.625, marks, 1)).toBeCloseTo(0.5);
  });
});

describe("fineAt", () => {
  const dome = { R: 500, cx: 600, cy: 700 };

  it("keeps the world outline on the dome", () => {
    expect(fineAt(dome, dome)).toBe(false);
  });

  it("takes the fine outline once the zoom has gone well in", () => {
    expect(fineAt({ R: 1200, cx: 600, cy: 300 }, dome)).toBe(true);
  });
});
