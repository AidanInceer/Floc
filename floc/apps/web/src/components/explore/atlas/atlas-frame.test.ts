import { describe, expect, it } from "vitest";

import { openArea } from "./atlas-frame";

const map = { left: 0, top: 0, right: 1280, bottom: 700 };

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
