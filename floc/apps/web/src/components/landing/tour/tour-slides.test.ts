import { describe, expect, it } from "vitest";

import { TOUR_SLIDES, tourSlides } from "./tour-slides";

describe("tourSlides", () => {
  it("uses the agreed feature colours in planning order", () => {
    expect(tourSlides(false).map(({ key, tone }) => [key, tone])).toEqual([
      ["where", "blue"],
      ["when", "yellow"],
      ["plan", "green"],
      ["money", "red"],
      ["packing", "blue"],
      ["notes", "yellow"],
      ["tickets", "green"],
    ]);
  });

  it("draws each slide on the trip tab its screen belongs to", () => {
    expect(tourSlides(false).map(({ key, page }) => [key, page])).toEqual([
      ["where", "overview"],
      ["when", "dates"],
      ["plan", "days"],
      ["money", "money"],
      ["packing", "packing"],
      ["notes", "notes"],
      ["tickets", "files"],
    ]);
  });

  it("keeps the Pro asides while Pro is on sale", () => {
    expect(tourSlides(true).some((s) => s.proExtra)).toBe(true);
  });

  it("drops the Pro asides when every feature is free, and keeps every slide", () => {
    const free = tourSlides(false);
    expect(free.some((s) => s.proExtra)).toBe(false);
    expect(free).toHaveLength(TOUR_SLIDES.length);
  });
});
