import { describe, expect, it } from "vitest";

import { spread } from "./pin-spread";

const gap = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

describe("spread", () => {
  it("leaves pins that are far enough apart where they are", () => {
    const pins = [{ x: 0, y: 0 }, { x: 100, y: 40 }];
    expect(spread(pins, 30)).toEqual(pins);
  });

  it("pushes two close pins apart about their middle", () => {
    const [a, b] = spread([{ x: 0, y: 0 }, { x: 10, y: 0 }], 30);
    expect(gap(a!, b!)).toBeCloseTo(30);
    expect((a!.x + b!.x) / 2).toBeCloseTo(5);
    expect(a!.y).toBe(0);
  });

  it("separates pins on the same spot", () => {
    const [a, b] = spread([{ x: 5, y: 5 }, { x: 5, y: 5 }], 30);
    expect(gap(a!, b!)).toBeGreaterThanOrEqual(29.5);
  });

  it("clears a cluster of three", () => {
    const out = spread([{ x: 0, y: 0 }, { x: 8, y: 2 }, { x: 4, y: 9 }], 30);
    for (let i = 0; i < out.length; i++) {
      for (let j = i + 1; j < out.length; j++) expect(gap(out[i]!, out[j]!)).toBeGreaterThanOrEqual(29.5);
    }
  });
});
