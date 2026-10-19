import { describe, expect, it } from "vitest";

import { thin } from "./thin";

describe("thin", () => {
  it("drops a point nearer than the gap to the last one kept", () => {
    const ring = [{ x: 0, y: 0 }, { x: 0.4, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 2 }, { x: 0, y: 0 }];
    expect(thin(ring, 1)).toEqual([{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 2 }, { x: 0, y: 0 }]);
  });

  it("keeps the last point, so the ring still closes", () => {
    const ring = [{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 5 }, { x: 0.3, y: 0.3 }, { x: 0, y: 0 }];
    expect(thin(ring, 1).at(-1)).toEqual({ x: 0, y: 0 });
  });

  it("leaves a ring with every point apart as it is", () => {
    const ring = [{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 5 }, { x: 0, y: 0 }];
    expect(thin(ring, 1)).toEqual(ring);
  });
});
