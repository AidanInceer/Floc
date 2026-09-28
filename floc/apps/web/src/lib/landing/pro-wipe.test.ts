import { describe, expect, it } from "vitest";

import { SWEEP_DELAY_MS, SWEEP_MS, litAt, stepWipe, sweepAt, wipeAt } from "./pro-wipe";

describe("sweepAt", () => {
  it("holds on the free page first, so the sweep reads as a change", () => {
    expect(sweepAt(0)).toBe(0);
    expect(sweepAt(SWEEP_DELAY_MS)).toBe(0);
  });

  it("crosses the page and rests on Pro", () => {
    expect(sweepAt(SWEEP_DELAY_MS + SWEEP_MS / 2)).toBeCloseTo(0.5);
    expect(sweepAt(SWEEP_DELAY_MS + SWEEP_MS)).toBe(1);
    expect(sweepAt(SWEEP_DELAY_MS + SWEEP_MS * 3)).toBe(1);
  });

  it("starts slow and ends slow", () => {
    expect(sweepAt(SWEEP_DELAY_MS + SWEEP_MS / 4)).toBeLessThan(0.25);
    expect(sweepAt(SWEEP_DELAY_MS + (SWEEP_MS * 3) / 4)).toBeGreaterThan(0.75);
  });
});

describe("litAt", () => {
  it("lights a row once the wiper reaches the values on the right", () => {
    expect(litAt(0.54, 0)).toBe(false);
    expect(litAt(0.55, 0)).toBe(true);
  });

  it("lights each later row a little later", () => {
    expect(litAt(0.6, 1)).toBe(false);
    expect(litAt(0.65, 1)).toBe(true);
  });

  it("lights every row when the wiper is all the way over", () => {
    expect(litAt(0.98, 6)).toBe(true);
  });
});

describe("wipeAt", () => {
  it("follows the pointer across the page", () => {
    expect(wipeAt(150, 100, 200)).toBe(0.25);
  });

  it("stops at the page edges", () => {
    expect(wipeAt(50, 100, 200)).toBe(0);
    expect(wipeAt(400, 100, 200)).toBe(1);
  });
});

describe("stepWipe", () => {
  it("moves a tenth per arrow key", () => {
    expect(stepWipe(0.5, "ArrowLeft")).toBeCloseTo(0.4);
    expect(stepWipe(0.5, "ArrowRight")).toBeCloseTo(0.6);
  });

  it("jumps to either end with Home and End", () => {
    expect(stepWipe(0.5, "Home")).toBe(0);
    expect(stepWipe(0.5, "End")).toBe(1);
  });

  it("stops at the ends", () => {
    expect(stepWipe(0.95, "ArrowRight")).toBe(1);
    expect(stepWipe(0.05, "ArrowLeft")).toBe(0);
  });

  it("ignores any other key", () => {
    expect(stepWipe(0.5, "Enter")).toBeNull();
  });
});
