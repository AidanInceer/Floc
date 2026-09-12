import { describe, expect, it } from "vitest";

import {
  AVATAR_ICONS,
  AVATAR_ICON_LABELS,
  parseAvatarIcon,
} from "./avatar-icon";
import { AVATAR_ICON_ART } from "./avatar-icon-art";

describe("avatar icons", () => {
  it("offers seventeen, so the picker is three rows of six", () => {
    expect(AVATAR_ICONS).toHaveLength(17);
  });

  it("names every one of them", () => {
    for (const icon of AVATAR_ICONS) {
      expect(AVATAR_ICON_LABELS[icon]).toBeTruthy();
    }
  });

  it("draws every one of them", () => {
    for (const icon of AVATAR_ICONS) {
      const art = AVATAR_ICON_ART[icon];
      expect(art.paths.length + art.circles.length).toBeGreaterThan(0);
    }
  });

  it("draws nothing it does not offer", () => {
    expect(Object.keys(AVATAR_ICON_ART).sort()).toEqual([...AVATAR_ICONS].sort());
  });

  it("stays inside the 14x14 box", () => {
    for (const icon of AVATAR_ICONS) {
      for (const c of AVATAR_ICON_ART[icon].circles) {
        expect(c.cx - c.r).toBeGreaterThanOrEqual(0);
        expect(c.cx + c.r).toBeLessThanOrEqual(14);
        expect(c.cy - c.r).toBeGreaterThanOrEqual(0);
        expect(c.cy + c.r).toBeLessThanOrEqual(14);
      }
    }
  });

  it("keeps a known icon", () => {
    expect(parseAvatarIcon("plane")).toBe("plane");
  });

  it("falls back to initials for anything else", () => {
    expect(parseAvatarIcon("tent")).toBeNull();
    expect(parseAvatarIcon("")).toBeNull();
    expect(parseAvatarIcon(null)).toBeNull();
    expect(parseAvatarIcon(42)).toBeNull();
  });
});
