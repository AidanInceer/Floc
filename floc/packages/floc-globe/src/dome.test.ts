import { describe, expect, it } from "vitest";

import { domeAt, zoomRange } from "./dome";

const WIDE = { w: 1032, h: 440 };
const PHONE = { w: 343, h: 330 };

describe("domeAt", () => {
  it("at rest, is wider than the box with its top just under the box's top", () => {
    const fit = domeAt(WIDE, 1);
    expect(fit.R).toBeCloseTo(1032 * 0.42);
    expect(fit.cx).toBe(516);
    expect(fit.cy - fit.R).toBe(16);
  });

  it("on a phone, keeps a sphere big enough to read", () => {
    expect(domeAt(PHONE, 1).R).toBe(240);
  });

  it("zoomed right out, shows the whole globe in the middle of the box", () => {
    const fit = domeAt(WIDE, zoomRange(WIDE).min);
    expect(fit.R).toBeCloseTo(440 / 2 - 8);
    expect(fit.cy).toBeCloseTo(220);
  });

  it("zoomed in, grows the sphere and keeps its middle where the dome had it", () => {
    const fit = domeAt(WIDE, 3);
    expect(fit.R).toBeCloseTo(1032 * 0.42 * 3);
    expect(fit.cy).toBeCloseTo(16 + 1032 * 0.42);
  });
});

describe("zoomRange", () => {
  it("runs from the whole globe to fourteen times it", () => {
    const { min, max } = zoomRange(WIDE);
    expect(domeAt(WIDE, max).R / domeAt(WIDE, min).R).toBeCloseTo(14);
  });

  it("holds at rest in a box not laid out yet, so a first paint at 0 by 0 never sets a negative zoom", () => {
    expect(zoomRange({ w: 0, h: 0 })).toEqual({ min: 1, max: 1 });
  });

  it("never asks to zoom out past rest when the whole globe is bigger than the dome", () => {
    expect(zoomRange({ w: 600, h: 900 }).min).toBe(1);
  });
});
