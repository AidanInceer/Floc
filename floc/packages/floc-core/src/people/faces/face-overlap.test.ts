import { describe, expect, it } from "vitest";

import { faceOverlap } from "./face-overlap";

// Two initials in DM Mono at 11 px: each glyph is 0.6 em, so the pair is 13.2 px wide on any letters.
const INITIALS = 2 * 0.6 * 11;

describe("faceOverlap", () => {
  it("tucks a stacked face under the one before by a seventh of its size", () => {
    expect(faceOverlap(28)).toBe(-4);
    expect(faceOverlap(26)).toBe(-4);
    expect(faceOverlap(22)).toBe(-3);
  });

  it("stops the next face before the initials of the one it covers, at every stacked size", () => {
    for (const size of [20, 22, 24, 26, 28, 32]) {
      const lettersEnd = (size + INITIALS) / 2;
      const nextFaceStarts = size + faceOverlap(size);
      expect(lettersEnd).toBeLessThanOrEqual(nextFaceStarts);
    }
  });
});
