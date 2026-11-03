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

  it("never hangs a tag nearer another stop than its own", () => {
    // Lisbon, Barcelona, Lagos on the Overview map at 375: Lisbon's name fell beside Lagos and Lagos's beside Lisbon.
    const view = { left: 24, top: 24, right: 319, bottom: 200 };
    const pins = [{ x: 69.805, y: 124.574 }, { x: 274.121, y: 61.503 }, { x: 76.274, y: 163.294 }];
    const sizes = [{ width: 96.367, height: 28 }, { width: 60.929, height: 28 }, { width: 92.071, height: 28 }];
    const legTags = [
      { left: 139.157, top: 54.926, right: 211.314, bottom: 74.926 },
      { left: 167.062, top: 130.253, right: 193.062, bottom: 150.253 },
    ];
    const spots = placeTags(pins, sizes, view, pins, legTags);
    const gap = (p: { x: number; y: number }, b: { left: number; top: number; right: number; bottom: number }) =>
      Math.hypot(Math.max(b.left - p.x, 0, p.x - b.right), Math.max(b.top - p.y, 0, p.y - b.bottom));
    spots.forEach((at, i) => {
      const own = pins[i]!;
      const box = { left: own.x + at.x, top: own.y + at.y, right: own.x + at.x + sizes[i]!.width, bottom: own.y + at.y + sizes[i]!.height };
      for (const other of pins.filter((_, j) => j !== i)) expect(gap(own, box)).toBeLessThan(gap(other, box));
    });
  });

  it("places only the tags it is given sizes for", () => {
    expect(placeTags([{ x: 0, y: 0 }, { x: 300, y: 0 }], [], WIDE)).toEqual([]);
  });

  it("keeps clear of a box it is told to avoid, as a mark on the line", () => {
    const name = { width: 40, height: 12 };
    const [free] = placeTags([{ x: 0, y: 0 }], [name], WIDE);
    const mark = { left: free!.x, top: free!.y, right: free!.x + 40, bottom: free!.y + 12 };
    const [moved] = placeTags([{ x: 0, y: 0 }], [name], WIDE, undefined, [mark]);
    expect(moved).not.toEqual(free);
  });
});
