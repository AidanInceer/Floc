import { describe, expect, it } from "vitest";

import { routeAt, type Point } from "./route-draw";

const three: Point[] = [
  [0, 0],
  [0, 10],
  [10, 10],
];

describe("routeAt", () => {
  it("shows only the first stop before the line starts", () => {
    expect(routeAt(three, 0)).toEqual({ path: [[0, 0], [0, 0]], shown: 1 });
  });

  it("gives each leg an equal share of the time", () => {
    expect(routeAt(three, 0.25)).toEqual({ path: [[0, 0], [0, 5]], shown: 1 });
    expect(routeAt(three, 0.75)).toEqual({ path: [[0, 0], [0, 10], [5, 10]], shown: 2 });
  });

  it("shows a stop once the line reaches it", () => {
    expect(routeAt(three, 0.5).shown).toBe(2);
  });

  it("draws the whole route at the end, and past it", () => {
    expect(routeAt(three, 1)).toEqual({ path: three, shown: 3 });
    expect(routeAt(three, 2)).toEqual({ path: three, shown: 3 });
  });

  it("shows a single stop at once, with no line", () => {
    expect(routeAt([[5, 5]], 0)).toEqual({ path: [[5, 5]], shown: 1 });
  });

  it("draws nothing for no stops", () => {
    expect(routeAt([], 0.5)).toEqual({ path: [], shown: 0 });
  });
});
