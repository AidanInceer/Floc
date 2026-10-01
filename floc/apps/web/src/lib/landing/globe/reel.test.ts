import { describe, expect, it } from "vitest";

import { reelTick, TICK } from "./reel";

describe("reelTick", () => {
  it("rolls the first tile at once", () => {
    expect(reelTick(0, 2000, 0)).toBe(1);
  });

  it("starts each tile a little after the one before", () => {
    expect(reelTick(3, 2000, 100)).toBe(0);
    expect(reelTick(3, 2000, 200)).toBe(1);
  });

  it("changes once every tick", () => {
    expect(reelTick(0, 5000, TICK - 1)).toBe(1);
    expect(reelTick(0, 5000, TICK)).toBe(2);
    expect(reelTick(0, 5000, TICK * 3)).toBe(4);
  });

  it("holds still just before the tile stops", () => {
    const before = reelTick(0, TICK * 3, TICK * 2);
    expect(reelTick(0, TICK * 3, TICK * 3 - 1)).toBe(before);
  });
});
