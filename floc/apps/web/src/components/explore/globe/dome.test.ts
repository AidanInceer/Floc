import { describe, expect, it } from "vitest";

import { project } from "@/lib/landing/globe/sphere";

import { domeFit, fineAt, over } from "./dome";

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

describe("fineAt", () => {
  const dome = { R: 500, cx: 600, cy: 700 };

  it("keeps the world outline on the dome", () => {
    expect(fineAt(dome, dome)).toBe(false);
  });

  it("takes the fine outline once the zoom has gone well in", () => {
    expect(fineAt({ R: 1200, cx: 600, cy: 300 }, dome)).toBe(true);
  });
});
