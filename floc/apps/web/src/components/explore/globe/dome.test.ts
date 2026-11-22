import { describe, expect, it } from "vitest";

import { project } from "@floc/globe/sphere";

import { domeFit, fineAt, lift, over, riseFor, ZOOMS, zoomed } from "./dome";

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
  it("shows the same share of the globe at any width", () => {
    const narrow = domeFit({ ...clear, right: 600 });
    const wide = domeFit({ ...clear, right: 1800 });
    expect(wide.R).toBe(narrow.R);
    expect((clear.bottom - (narrow.cy - narrow.R)) / (2 * narrow.R)).toBeCloseTo(0.5);
  });

  it("stands the globe on the top of the part the card leaves clear, centred across it", () => {
    const fit = domeFit(clear);
    expect(fit.cx).toBe(426);
    expect(fit.cy - fit.R).toBe(clear.top + 16);
  });

  it("keeps a dome a phone can read", () => {
    expect(domeFit({ left: 8, top: 68, right: 367, bottom: 200 }).R).toBe(250);
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

describe("zoomed", () => {
  const fit = { R: 500, cx: 640, cy: 516 };

  it("is the dome itself at a zoom of 1", () => {
    expect(zoomed(fit, 1, clear)).toEqual(fit);
  });

  it("makes the globe bigger as it zooms", () => {
    expect(zoomed(fit, 1.5, clear).R).toBe(750);
    expect(zoomed(fit, 2.25, clear).cx).toBe(640);
  });

  it("brings the place in view to the middle of the clear part at the last zoom, face on", () => {
    const near = zoomed(fit, ZOOMS[ZOOMS.length - 1]!, clear);
    expect(near.cy).toBeCloseTo((clear.top + clear.bottom) / 2);
  });
});

describe("lift", () => {
  const view = { lat: 10, lng: 20 };

  it("leaves the view alone on the whole globe", () => {
    expect(lift(view, 1)).toEqual(view);
  });

  it("turns the globe until the place in view faces you at the last zoom", () => {
    const place = { lat: 50, lng: 20 };
    const near = lift(over(place), ZOOMS[ZOOMS.length - 1]!);
    expect(near.lat).toBeCloseTo(place.lat);
    expect(near.lng).toBe(place.lng);
  });

  it("never turns past the pole", () => {
    expect(lift({ lat: 80, lng: 0 }, 2.25).lat).toBeLessThan(90);
  });
});

describe("riseFor", () => {
  it("is the full rise for a place the dome can stand on its upper part", () => {
    const lima = { lat: -12, lng: -77 };
    expect(riseFor(over(lima), lima)).toBe(40);
  });

  it("is the real distance up to a place further south than the globe turns", () => {
    const calafate = { lat: -50.3, lng: -72.3 };
    expect(riseFor(over(calafate), calafate)).toBeCloseTo(19.7);
  });

  it("brings a far south place face on at the last zoom", () => {
    const calafate = { lat: -50.3, lng: -72.3 };
    const view = over(calafate);
    expect(lift(view, ZOOMS[ZOOMS.length - 1]!, riseFor(view, calafate)).lat).toBeCloseTo(calafate.lat);
  });

  it("grows back to the full rise as the view turns north of the limit", () => {
    const calafate = { lat: -50.3, lng: -72.3 };
    expect(riseFor({ lat: -65, lng: 0 }, calafate)).toBeGreaterThan(riseFor({ lat: -70, lng: 0 }, calafate));
    expect(riseFor({ lat: -60, lng: 0 }, calafate)).toBe(40);
  });
});
