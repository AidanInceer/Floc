import { describe, expect, it } from "vitest";

import { filmPosition, nearestSlide, stepSlide } from "./carousel";

describe("nearestSlide", () => {
  const starts = [0, 1000, 2000, 3000];

  it("picks the slide whose start is closest to the scroll position", () => {
    expect(nearestSlide(starts, 1380)).toBe(1);
    expect(nearestSlide(starts, 1620)).toBe(2);
  });

  it("stays on the last slide past the end", () => {
    expect(nearestSlide(starts, 9000)).toBe(3);
  });
});

describe("stepSlide", () => {
  it("moves one slide either way", () => {
    expect(stepSlide(2, 1, 6)).toBe(3);
    expect(stepSlide(2, -1, 6)).toBe(1);
  });

  it("wraps between the first and last slides", () => {
    expect(stepSlide(5, 1, 6)).toBe(0);
    expect(stepSlide(0, -1, 6)).toBe(5);
  });
});

describe("filmPosition", () => {
  it("uses the neighbouring copy across each seam", () => {
    expect(filmPosition(0, 5, 6)).toBe(0);
    expect(filmPosition(5, 0, 6)).toBe(7);
  });

  it("uses the real slide for other jumps", () => {
    expect(filmPosition(1, 4, 6)).toBe(5);
  });
});
