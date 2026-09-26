import { describe, expect, it } from "vitest";

import { TOUR_SLIDES, tourSlides } from "./tour-slides";

describe("tourSlides", () => {
  it("keeps the Pro asides while Pro is on sale", () => {
    expect(tourSlides(true).some((s) => s.proExtra)).toBe(true);
  });

  it("drops the Pro asides when every feature is free, and keeps every slide", () => {
    const free = tourSlides(false);
    expect(free.some((s) => s.proExtra)).toBe(false);
    expect(free).toHaveLength(TOUR_SLIDES.length);
  });
});
