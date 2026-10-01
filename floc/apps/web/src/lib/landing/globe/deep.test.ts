import { describe, expect, it } from "vitest";

import { cornerAt, coverRadius, deepFrame, flagSide, frameAt, nudges, pinsOf, roomIn, tweenAt, zoomFor } from "./deep";

const RAD = Math.PI / 180;
const TOKYO = { lat: 35.676, lng: 139.65 };
const OSAKA = { lat: 34.694, lng: 135.502 };
const NATALES = { lat: -51.729, lng: -72.507 };
const PAINE = { lat: -50.999, lng: -72.986 };
const FRANZ_JOSEF = { lat: -43.389, lng: 170.183 };
const AORAKI = { lat: -43.595, lng: 170.142 };

describe("pinsOf", () => {
  it("gives each place one pin, with every stop number it holds", () => {
    expect(pinsOf([NATALES, PAINE, NATALES])).toEqual([
      { ...NATALES, stops: [0, 2] },
      { ...PAINE, stops: [1] },
    ]);
  });
});

describe("deepFrame", () => {
  it("is taller and off-centre on a wide screen, where the rail covers the right", () => {
    expect(deepFrame(true)).toMatchObject({ h: 560, fx: 0.34 });
    expect(deepFrame(false)).toMatchObject({ h: 400, fx: 0.5 });
  });
});

describe("roomIn", () => {
  it("is bounded by the shorter side of the clear part of the map", () => {
    expect(roomIn({ w: 1072, h: 560 }, true)).toBeCloseTo(179.2);
    expect(roomIn({ w: 347, h: 400 }, false)).toBeCloseTo(117.98);
  });
});

describe("zoomFor", () => {
  it("goes in closer for a trip whose stops are near each other", () => {
    const far = [TOKYO, { lat: 21.028, lng: 105.804 }];
    expect(zoomFor([TOKYO, OSAKA], 180, 9000)).toBeGreaterThan(zoomFor(far, 180, 9000));
  });

  it("stops at the closest zoom the land outline can take", () => {
    expect(zoomFor([TOKYO], 180, 5200)).toBe(5200);
    expect(zoomFor([FRANZ_JOSEF, AORAKI], 180, 5200)).toBe(5200);
  });

  it("never sits further out than a country", () => {
    expect(zoomFor([TOKYO, { lat: -33.9, lng: 18.4 }], 180, 5200)).toBe(1400);
  });
});

describe("cornerAt", () => {
  it("goes from a circle to a rounded panel", () => {
    expect(cornerAt(0, 210)).toBe(210);
    expect(cornerAt(1, 210)).toBe(28);
  });
});

describe("coverRadius", () => {
  it("is the circle itself while the box is a circle", () => {
    expect(coverRadius({ w: 420, h: 420 }, 210, 0)).toBe(210);
  });

  it("reaches the far corner of a wide box, and further when the middle is off-centre", () => {
    const centred = coverRadius({ w: 1000, h: 500 }, 28, 0);
    expect(centred).toBeCloseTo(Math.hypot(472, 222) + 28);
    expect(coverRadius({ w: 1000, h: 500 }, 28, -160)).toBeCloseTo(centred + 160);
  });
});

describe("frameAt", () => {
  const cam = { R: 5000, fx: 0.34 };

  it("is the plain globe when shut", () => {
    expect(frameAt(0, { w: 420, h: 420 }, 210, cam)).toEqual({ R: 208, cx: 210, cy: 210 });
  });

  it("is the full zoom, centred clear of the rail, when open", () => {
    expect(frameAt(1, { w: 1000, h: 560 }, 210, cam)).toEqual({ R: 5000, cx: 340, cy: 280 });
  });

  it("always fills its box on the way in", () => {
    const box = { w: 485, h: 434 };
    const { R } = frameAt(0.1, box, 210, cam);
    expect(R).toBeGreaterThanOrEqual(coverRadius(box, cornerAt(0.1, 210), 0));
  });
});

describe("tweenAt", () => {
  const tween = { from: 0, to: 1, t0: 1000, ms: 400 };

  it("starts at one end and finishes at the other", () => {
    expect(tweenAt(tween, 1000)).toEqual({ v: 0, done: false });
    expect(tweenAt(tween, 1400)).toEqual({ v: 1, done: true });
  });

  it("is halfway at half time", () => {
    expect(tweenAt(tween, 1200).v).toBeCloseTo(0.5);
  });

  it("is done at once when it takes no time", () => {
    expect(tweenAt({ ...tween, ms: 0 }, 1000)).toEqual({ v: 1, done: true });
  });
});

describe("nudges", () => {
  it("pushes two pins that would overlap just clear of each other", () => {
    const [a, b] = nudges([FRANZ_JOSEF, AORAKI], 5200, 27);
    const flat = {
      x: 5200 * (AORAKI.lng - FRANZ_JOSEF.lng) * RAD * Math.cos(FRANZ_JOSEF.lat * RAD),
      y: -5200 * (AORAKI.lat - FRANZ_JOSEF.lat) * RAD,
    };
    expect(Math.hypot(flat.x + b!.x - a!.x, flat.y + b!.y - a!.y)).toBeCloseTo(27);
  });

  it("leaves pins that are already apart where they are", () => {
    expect(nudges([TOKYO, OSAKA], 5200, 27)).toEqual([{ x: 0, y: 0 }, { x: 0, y: 0 }]);
  });
});

describe("flagSide", () => {
  const box = { w: 600, h: 400 };
  const flag = { w: 80, h: 24 };

  it("puts the name to the right when that is clear", () => {
    expect(flagSide(0, [{ x: 300, y: 200 }], flag, box)).toBe("r");
  });

  it("goes left when another pin is in the way on the right", () => {
    expect(flagSide(0, [{ x: 300, y: 200 }, { x: 350, y: 200 }], flag, box)).toBe("l");
  });

  it("goes above when both sides are taken", () => {
    const pts = [{ x: 300, y: 200 }, { x: 350, y: 200 }, { x: 250, y: 200 }];
    expect(flagSide(0, pts, flag, box)).toBe("t");
  });

  it("goes left at the right edge of the map", () => {
    expect(flagSide(0, [{ x: 560, y: 200 }], flag, box)).toBe("l");
  });

  it("falls back to the right when no side is clear", () => {
    const tight = { w: 60, h: 30 };
    expect(flagSide(0, [{ x: 30, y: 15 }], flag, tight)).toBe("r");
  });
});
