import { describe, expect, it } from "vitest";

import { clearOf, openArea } from "./atlas-frame";

const map = { left: 0, top: 0, right: 1280, bottom: 700 };

describe("clearOf", () => {
  it("keeps the view left of a card that sits over the map", () => {
    const card = { left: 855, top: 92, right: 1255, bottom: 560 };
    expect(clearOf(map, card)).toEqual({ paddingTopLeft: [64, 80], paddingBottomRight: [449, 40] });
  });

  it("needs no room for a card below the map", () => {
    const card = { left: 16, top: 720, right: 359, bottom: 1200 };
    expect(clearOf(map, card)).toEqual({ paddingTopLeft: [64, 80], paddingBottomRight: [40, 40] });
  });

  it("needs no room when there is no card", () => {
    expect(clearOf(map, null).paddingBottomRight).toEqual([40, 40]);
  });

  it("adds room on the right for what hangs off a stop", () => {
    const card = { left: 855, top: 92, right: 1255, bottom: 560 };
    expect(clearOf(map, card, 100).paddingBottomRight).toEqual([549, 40]);
  });

  it("gives that room at most a fifth of the clear width, so a phone keeps its map", () => {
    const phone = { left: 0, top: 0, right: 375, bottom: 300 };
    expect(clearOf(phone, null, 200).paddingBottomRight).toEqual([94, 40]);
  });
});

describe("openArea", () => {
  it("is the map clear of the bar, the controls and the card, in the map's own pixels", () => {
    const card = { left: 855, top: 92, right: 1255, bottom: 560 };
    expect(openArea({ left: 0, top: 100, right: 1280, bottom: 800 }, card)).toEqual({ left: 52, top: 68, right: 847, bottom: 676 });
  });

  it("runs the full width when the card sits below the map", () => {
    const card = { left: 16, top: 720, right: 359, bottom: 1200 };
    expect(openArea(map, card)).toEqual({ left: 52, top: 68, right: 1272, bottom: 676 });
  });
});
