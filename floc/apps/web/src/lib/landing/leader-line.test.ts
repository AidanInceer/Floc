import { describe, expect, it } from "vitest";

import { leaderLine } from "./leader-line";

const box = (left: number, top: number, width: number, height: number) => ({
  left,
  top,
  right: left + width,
  bottom: top + height,
  width,
  height,
});

describe("leaderLine", () => {
  const device = box(400, 0, 500, 600);
  const row = box(420, 200, 200, 40);

  it("runs from a note on the left to the device's left edge, level with the row", () => {
    const line = leaderLine(box(0, 100, 300, 80), device, row);
    expect(line.start).toEqual({ x: 300, y: 122 });
    expect(line.end).toEqual({ x: 406, y: 220 });
  });

  it("runs from a note on the right to the device's right edge", () => {
    const line = leaderLine(box(1000, 100, 300, 80), device, row);
    expect(line.start).toEqual({ x: 1000, y: 122 });
    expect(line.end).toEqual({ x: 894, y: 220 });
  });

  it("curves through the midpoint so the line leaves and lands level", () => {
    const { d } = leaderLine(box(0, 100, 300, 80), device, row);
    expect(d).toBe("M300 122 C353 122 353 220 406 220");
  });
});
