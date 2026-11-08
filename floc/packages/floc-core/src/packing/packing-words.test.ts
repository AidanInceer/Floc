import { describe, expect, it } from "vitest";

import { cubeCount, thingCount } from "./packing-words";

describe("thingCount", () => {
  it("says one thing, or how many things", () => {
    expect(thingCount(1)).toBe("1 thing");
    expect(thingCount(4)).toBe("4 things");
  });
});

describe("cubeCount", () => {
  it("shows packed over total", () => {
    expect(cubeCount(1, 3)).toEqual({ text: "1/3", full: false });
  });

  it("says all packed when every line is", () => {
    expect(cubeCount(2, 2)).toEqual({ text: "All packed", full: true });
  });

  it("is never full when the cube is empty", () => {
    expect(cubeCount(0, 0)).toEqual({ text: "0/0", full: false });
  });
});
