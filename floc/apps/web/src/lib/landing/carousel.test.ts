import { describe, expect, it } from "vitest";

import { FILM_COPIES, nearestCopy, nearestSlide, recentre } from "./carousel";

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

describe("nearestCopy", () => {
  it("goes back across the seam rather than forward through every slide", () => {
    expect(nearestCopy(6, 5, 6)).toBe(5);
  });

  it("goes forward across the seam from the last slide", () => {
    expect(nearestCopy(11, 0, 6)).toBe(12);
  });

  it("uses the middle copy for jumps inside it", () => {
    expect(nearestCopy(7, 4, 6)).toBe(10);
  });

  it("prefers the middle copy when both ways are as far", () => {
    expect(nearestCopy(6, 3, 6)).toBe(9);
  });

  it("stays on the film from an outer copy", () => {
    expect(nearestCopy(0, 5, 6)).toBe(5);
    expect(nearestCopy(17, 0, 6)).toBe(12);
  });
});

describe("recentre", () => {
  it("moves a slide in an outer copy to the same slide in the middle copy", () => {
    expect(recentre(5, 6)).toBe(11);
    expect(recentre(12, 6)).toBe(6);
  });

  it("leaves the middle copy alone", () => {
    expect(recentre(8, 6)).toBe(8);
  });

  it("lays the film out as three copies", () => {
    expect(FILM_COPIES).toBe(3);
  });
});
