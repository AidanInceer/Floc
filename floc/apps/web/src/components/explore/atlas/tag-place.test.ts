import { describe, expect, it } from "vitest";

import { placeTags } from "./tag-place";

const WIDE = { left: -1000, top: -1000, right: 1000, bottom: 1000 };
const tag = { width: 100, height: 20 };

describe("placeTags", () => {
  it("hangs a lone tag on the right", () => {
    expect(placeTags([{ x: 0, y: 0 }], [tag], WIDE)).toEqual([{ x: 18, y: -10 }]);
  });

  it("moves a tag left when the next stop sits on its right", () => {
    expect(placeTags([{ x: 0, y: 0 }, { x: 40, y: 0 }], [tag, tag], WIDE)).toEqual([
      { x: -118, y: -10 },
      { x: 18, y: -10 },
    ]);
  });

  it("keeps a tag off the route line", () => {
    const small = { width: 50, height: 20 };
    expect(placeTags([{ x: 0, y: 0 }, { x: 200, y: 0 }], [small, small], WIDE)).toEqual([
      { x: -68, y: -10 },
      { x: 18, y: -10 },
    ]);
  });

  it("keeps a tag off a line given apart from the pins", () => {
    const small = { width: 50, height: 20 };
    const route = [{ x: 0, y: 0 }, { x: 200, y: 0 }, { x: 0, y: 0 }];
    expect(placeTags([{ x: 0, y: 0 }], [small], WIDE, route)).toEqual([{ x: -68, y: -10 }]);
  });

  it("keeps a tag clear of an earlier tag", () => {
    const tall = { width: 100, height: 120 };
    expect(placeTags([{ x: 0, y: 0 }, { x: 0, y: 60 }], [tall, tag], WIDE)).toEqual([
      { x: 18, y: -60 },
      { x: -118, y: -10 },
    ]);
  });

  it("keeps a tag inside the clear part of the map", () => {
    expect(placeTags([{ x: 0, y: 0 }], [tag], { ...WIDE, right: 50 })).toEqual([{ x: -118, y: -10 }]);
  });

  it("goes further out when every spot next to the stop is taken", () => {
    const around = [
      [40, 0], [-40, 0], [0, -30], [0, 30], [30, -30], [30, 30], [-30, -30], [-30, 30],
    ].map(([x, y]) => ({ x: x as number, y: y as number }));
    const small = { width: 20, height: 10 };
    const [at] = placeTags([{ x: 0, y: 0 }, ...around], [small], WIDE);
    const box = { left: at!.x, top: at!.y, right: at!.x + 20, bottom: at!.y + 10 };
    for (const p of around) {
      const hits = box.left < p.x + 13 && box.right > p.x - 13 && box.top < p.y + 13 && box.bottom > p.y - 13;
      expect(hits).toBe(false);
    }
  });

  it("places only the tags it is given sizes for", () => {
    expect(placeTags([{ x: 0, y: 0 }, { x: 300, y: 0 }], [], WIDE)).toEqual([]);
  });
});
