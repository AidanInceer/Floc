import { describe, expect, it } from "vitest";

import { shouldStartTour, tourStep, tourStopsFor } from "./tour";

describe("which stops the tour shows (#315)", () => {
  it("shows all seven, in planning order", () => {
    expect(tourStopsFor({ hasFiles: true }).map((s) => s.key)).toEqual([
      "roster",
      "dates",
      "days",
      "money",
      "packing",
      "notes",
      "files",
    ]);
  });

  it("skips Files when there is nowhere to keep them", () => {
    const keys = tourStopsFor({ hasFiles: false }).map((s) => s.key);
    expect(keys).not.toContain("files");
    expect(keys).toHaveLength(6);
  });

  it("gives every stop a title and one line", () => {
    for (const stop of tourStopsFor({ hasFiles: true })) {
      expect(stop.title.length).toBeGreaterThan(0);
      expect(stop.line.length).toBeGreaterThan(0);
    }
  });
});

describe("whether the tour starts", () => {
  it("starts for a person who has never seen it", () => {
    expect(shouldStartTour({ seen: false })).toBe(true);
  });

  it("never starts again once seen or skipped", () => {
    expect(shouldStartTour({ seen: true })).toBe(false);
  });
});

describe("moving through the tour", () => {
  const start = { index: 0, done: false };

  it("goes forward and back", () => {
    const second = tourStep(start, "next", 3);
    expect(second).toEqual({ index: 1, done: false });
    expect(tourStep(second, "back", 3)).toEqual(start);
  });

  it("does not go back past the first stop", () => {
    expect(tourStep(start, "back", 3)).toEqual(start);
  });

  it("finishes on next from the last stop", () => {
    expect(tourStep({ index: 2, done: false }, "next", 3)).toEqual({ index: 2, done: true });
  });

  it("finishes on skip from any stop", () => {
    expect(tourStep({ index: 1, done: false }, "skip", 3).done).toBe(true);
  });
});
