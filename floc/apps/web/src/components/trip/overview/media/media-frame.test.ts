import { describe, expect, it } from "vitest";

import { trueRatio, viewerFrame } from "./media-frame";

describe("trueRatio", () => {
  it("keeps the real shape of a panorama past the gallery's clamp", () => {
    expect(trueRatio(3000, 1000, 2.2)).toBe(3);
  });

  it("keeps the real shape of a tall portrait", () => {
    expect(trueRatio(1000, 2000, 0.6)).toBe(0.5);
  });

  it("falls back when the file reports no size", () => {
    expect(trueRatio(0, 0, 1.5)).toBe(1.5);
  });
});

describe("viewerFrame", () => {
  it("gives the picture box the shape of a landscape photo", () => {
    expect(viewerFrame(1.5).picture.aspectRatio).toBe(1.5);
  });

  it("gives the picture box the shape of a portrait photo", () => {
    expect(viewerFrame(0.6).picture.aspectRatio).toBe(0.6);
  });

  it("sizes the card from the height left under the bar", () => {
    expect(viewerFrame(0.6).card.width).toContain("(100cqh - 3.25rem) * 0.6");
  });

  it("never lets the card pass the width of the screen", () => {
    expect(viewerFrame(2).card.width).toContain("min(100cqw,");
  });

  it("keeps the card wide enough for the bar", () => {
    expect(viewerFrame(0.6).card.width).toContain("max(min(20rem, 100cqw),");
  });

  it("caps the picture at the height left under the bar", () => {
    expect(viewerFrame(1).picture.maxHeight).toBe("calc(100cqh - 3.25rem)");
  });
});
