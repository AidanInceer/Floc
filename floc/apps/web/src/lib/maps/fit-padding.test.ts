import { describe, expect, it } from "vitest";

import { fitPadding, NAME_ROOM } from "./fit-padding";

const BAND = { left: 24, top: 200, right: 1256, bottom: 744 };

describe("fitPadding", () => {
  it("keeps the route off every edge, and off Google's zoom buttons on the left", () => {
    expect(fitPadding(BAND, null)).toEqual({ top: 56, right: 56, bottom: 56, left: 96 });
  });

  it("keeps the route clear of a card that sits over the map's right side", () => {
    const card = { left: 900, top: 220, right: 1236, bottom: 560 };
    expect(fitPadding(BAND, card)).toEqual({ top: 56, right: 412, bottom: 56, left: 96 });
  });

  it("ignores a card stacked under the map, as on a phone", () => {
    const card = { left: 24, top: 744, right: 1256, bottom: 1100 };
    expect(fitPadding(BAND, card)).toEqual({ top: 56, right: 56, bottom: 56, left: 96 });
  });

  it("leaves room for the eastmost stop's name, so it never runs under the card or off the map", () => {
    const card = { left: 900, top: 220, right: 1236, bottom: 560 };
    expect(fitPadding(BAND, card, NAME_ROOM).right).toBe(412 + NAME_ROOM);
    expect(fitPadding(BAND, null, NAME_ROOM).right).toBe(56 + NAME_ROOM);
  });
});
