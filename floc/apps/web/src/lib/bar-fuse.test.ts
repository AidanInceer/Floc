import { describe, expect, it } from "vitest";

import {
  SCROLL_RANGE,
  foldAmount,
  joinStep,
  nextJoined,
  restGap,
  scrollProgress,
  skinPath,
  splitStep,
  wantJoined,
} from "./bar-fuse";

describe("scrollProgress", () => {
  it("is 0 at the top and 1 once past the range", () => {
    expect(scrollProgress(0)).toBe(0);
    expect(scrollProgress(SCROLL_RANGE)).toBe(1);
    expect(scrollProgress(SCROLL_RANGE * 3)).toBe(1);
  });

  it("never goes below 0 on an overscroll bounce", () => {
    expect(scrollProgress(-40)).toBe(0);
  });
});

describe("foldAmount", () => {
  it("is 0 at the top, 1 from 0.55 of the range on, and rises in between", () => {
    expect(foldAmount(0)).toBe(0);
    expect(foldAmount(0.55)).toBe(1);
    expect(foldAmount(1)).toBe(1);
    expect(foldAmount(0.2)).toBeGreaterThan(0);
    expect(foldAmount(0.2)).toBeLessThan(foldAmount(0.4));
  });
});

describe("restGap", () => {
  it("starts at the bar's gap and closes by a third before the join", () => {
    expect(restGap(0, 6)).toBe(6);
    expect(restGap(0.55, 6)).toBeCloseTo(4, 5);
    expect(restGap(1, 6)).toBeCloseTo(4, 5);
  });
});

describe("nextJoined", () => {
  it("joins at 0.55 and not before", () => {
    expect(nextJoined(false, 0.54)).toBe(false);
    expect(nextJoined(false, 0.55)).toBe(true);
  });

  it("stays joined down to 0.45, so a hovering scroll does not flicker", () => {
    expect(nextJoined(true, 0.5)).toBe(true);
    expect(nextJoined(true, 0.46)).toBe(true);
    expect(nextJoined(true, 0.44)).toBe(false);
  });

  it("stays apart between the two marks", () => {
    expect(nextJoined(false, 0.5)).toBe(false);
  });
});

describe("joinStep", () => {
  const from = { gap: 4, neck: 0 };

  it("starts where it is and ends shut, with the neck full", () => {
    expect(joinStep(0, from)).toEqual(from);
    expect(joinStep(1, from)).toEqual({ gap: 0, neck: 1 });
  });

  it("only ever closes the gap and grows the neck", () => {
    let last = joinStep(0, from);
    for (let k = 0.1; k <= 1.001; k += 0.1) {
      const now = joinStep(k, from);
      expect(now.gap).toBeLessThanOrEqual(last.gap + 1e-9);
      expect(now.neck).toBeGreaterThanOrEqual(last.neck - 1e-9);
      last = now;
    }
  });

  it("carries on from a neck that is part grown", () => {
    expect(joinStep(0, { gap: 2, neck: 0.4 }).neck).toBeCloseTo(0.4, 5);
  });
});

describe("splitStep", () => {
  it("starts joined and ends at the resting gap with no neck", () => {
    const from = { gap: 0, neck: 1 };
    expect(splitStep(0, from, 5)).toEqual(from);
    expect(splitStep(1, from, 5)).toEqual({ gap: 5, neck: 0 });
  });
});

describe("skinPath", () => {
  const boxes = [
    { x: 0, w: 100 },
    { x: 104, w: 120 },
    { x: 228, w: 44 },
  ];

  it("draws one rounded rectangle for each bead when no neck is out", () => {
    const d = skinPath(boxes, 44, 12, [0, 0]);
    expect(d.match(/Z/g)).toHaveLength(3);
  });

  it("adds a neck only to the joins that have one", () => {
    const d = skinPath(boxes, 44, 12, [0.6, 0]);
    expect(d.match(/Z/g)).toHaveLength(4);
    expect(d).toContain("Q");
  });

  it("leaves out a neck too thin to see", () => {
    const d = skinPath(boxes, 44, 12, [0.0005, 0]);
    expect(d.match(/Z/g)).toHaveLength(3);
  });

  it("spans the neck between the two beads' inner edges", () => {
    const d = skinPath(boxes.slice(0, 2), 44, 12, [1]);
    expect(d).toContain("M88 0Q102 0 116 0");
  });
});

describe("wantJoined", () => {
  it("holds the beads joined while a trip opens, whatever the scroll", () => {
    expect(wantJoined(false, 0, true)).toBe(true);
  });
  it("follows the scroll again once the hold lets go", () => {
    expect(wantJoined(true, 0, false)).toBe(false);
    expect(wantJoined(false, 1, false)).toBe(true);
  });
});
