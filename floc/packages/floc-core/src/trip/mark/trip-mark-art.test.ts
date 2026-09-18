import { describe, expect, it } from "vitest";

import { AVATAR_ICON_ART } from "../../people/avatar-icon-art";
import { TRIP_MARKS } from "./trip-mark";
import { TRIP_MARK_ART } from "./trip-mark-art";

describe("TRIP_MARK_ART (#318)", () => {
  it("draws every mark in the set", () => {
    for (const mark of TRIP_MARKS) {
      const art = TRIP_MARK_ART[mark];
      expect(art.paths.length + art.circles.length).toBeGreaterThan(0);
    }
  });

  it("reuses the person drawing where the shape is the same, so the two cannot drift", () => {
    expect(TRIP_MARK_ART.mountain).toBe(AVATAR_ICON_ART.mountain);
    expect(TRIP_MARK_ART.sun).toBe(AVATAR_ICON_ART.sun);
  });
});
