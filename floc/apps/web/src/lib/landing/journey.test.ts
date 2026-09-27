import { describe, expect, it } from "vitest";

import { journeyAt, journeyShares, routeLengths } from "./journey";

// Iceland: 1, 1, 2, 2, 1 nights.
const shares = journeyShares([1, 1, 2, 2, 1]);
const cum = [0, 10, 30, 40, 100];

describe("journeyShares", () => {
  it("places each stop at the share of nights before it", () => {
    expect(shares.from.map((f) => f * 7)).toEqual([0, 1, 2, 4, 6]);
    expect(shares.len.map((l) => l * 7)).toEqual([1, 1, 2, 2, 1]);
  });
});

describe("journeyAt", () => {
  it("draws nothing and reaches only the first stop at the start", () => {
    const at = journeyAt(0, shares, cum);
    expect(at.drawn).toBe(0);
    expect(at.reached).toEqual([true, false, false, false, false]);
  });

  it("brings the line to a stop the moment the bar reaches that stop", () => {
    const at = journeyAt(4 / 7, shares, cum);
    expect(at.drawn).toBeCloseTo(40);
    expect(at.reached).toEqual([true, true, true, true, false]);
    expect(at.fill.slice(0, 3)).toEqual([1, 1, 1]);
    expect(at.fill[3]).toBeCloseTo(0);
  });

  it("moves the line along a leg while the bar fills that stop", () => {
    const at = journeyAt(5 / 7, shares, cum);
    expect(at.fill[3]).toBeCloseTo(0.5);
    expect(at.drawn).toBeCloseTo(70);
  });

  it("draws the whole route by the end", () => {
    const at = journeyAt(1, shares, cum);
    expect(at.drawn).toBe(100);
    expect(at.fill).toEqual([1, 1, 1, 1, 1]);
  });
});

describe("routeLengths", () => {
  it("starts at zero and adds each leg to the one before", () => {
    const one = routeLengths([
      [0, 0],
      [100, 0],
    ])[1];
    const lengths = routeLengths([
      [0, 0],
      [100, 0],
      [200, 0],
    ]);
    expect(lengths[0]).toBe(0);
    expect(lengths[2]).toBeCloseTo(2 * one);
  });

  it("measures a bent leg a little longer than the straight line", () => {
    const [, one] = routeLengths([
      [0, 0],
      [100, 0],
    ]);
    expect(one).toBeGreaterThan(100);
    expect(one).toBeLessThan(110);
  });
});
