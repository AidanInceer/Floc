import { describe, expect, it } from "vitest";

import { canvasZoom, pixelRatio, unzoomed } from "./pixel-ratio";

describe("canvasZoom", () => {
  it("reads the zoom a page puts on a canvas", () => {
    expect(canvasZoom(" 1.144 ")).toBeCloseTo(1.144);
  });

  it("is 1 when nothing sets one, or the value is not a usable number", () => {
    expect(canvasZoom("")).toBe(1);
    expect(canvasZoom("wide")).toBe(1);
    expect(canvasZoom("0")).toBe(1);
    expect(canvasZoom("-2")).toBe(1);
  });
});

describe("unzoomed", () => {
  const rect = { left: 10, top: 20, right: 110, bottom: 220 };

  it("turns a rectangle read from a zoomed page back into the canvas's own pixels", () => {
    expect(unzoomed(rect, 0.5)).toEqual({ left: 20, top: 40, right: 220, bottom: 440 });
  });

  it("leaves it alone when there is no zoom", () => {
    expect(unzoomed(rect, 1)).toEqual(rect);
  });
});

describe("pixelRatio", () => {
  it("is the screen's own ratio when the canvas is not zoomed", () => {
    expect(pixelRatio(1, 1)).toBe(1);
    expect(pixelRatio(2, 1)).toBe(2);
  });

  it("draws more pixels for a canvas shown larger, so it stays sharp", () => {
    expect(pixelRatio(1, 1.5)).toBe(1.5);
  });

  it("draws fewer for a canvas shown smaller", () => {
    expect(pixelRatio(2, 0.5)).toBe(1);
  });

  it("never goes past 2, which keeps a full-screen redraw cheap", () => {
    expect(pixelRatio(2, 1.5)).toBe(2);
  });
});
