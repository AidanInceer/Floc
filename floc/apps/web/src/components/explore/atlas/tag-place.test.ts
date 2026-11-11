import { describe, expect, it } from "vitest";

import { covered, crowded, placeTags } from "./tag-place";

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

  it("slides a tag inside the map when no spot is clear, so it never clips", () => {
    // Swakopmund on the landing Borrow map at 375: boxed in by its neighbours, its name ran off the left edge.
    const view = { left: 0, top: 0, right: 300, bottom: 300 };
    const pins = [{ x: 30, y: 150 }, { x: 70, y: 150 }, { x: 30, y: 110 }, { x: 30, y: 190 }];
    const sizes = [{ width: 80, height: 28 }];
    const [at] = placeTags(pins, sizes, view);
    const left = at ? 30 + at.x : view.left;
    expect(left).toBeGreaterThanOrEqual(view.left);
    expect(left + 80).toBeLessThanOrEqual(view.right);
  });

  it("never slides a tag onto a tag placed before it", () => {
    // Chobe and Victoria Falls on the landing Borrow map at 375: the second name slid in from the edge onto the first.
    const view = { left: 0, top: 0, right: 300, bottom: 200 };
    const pins = [{ x: 191, y: 184 }, { x: 6, y: 180 }, { x: 56, y: 194 }, { x: 170, y: 136 }];
    const sizes = [61, 58, 57, 85].map((width) => ({ width, height: 28 }));
    const boxes = placeTags(pins, sizes, view).flatMap((at, i) => (at ? [{ x: pins[i]!.x + at.x, y: pins[i]!.y + at.y, ...sizes[i]! }] : []));
    boxes.forEach((a, i) =>
      boxes.slice(0, i).forEach((b) => {
        const apart = a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y;
        expect(apart).toBe(true);
      }),
    );
  });

  it("goes further out when every spot next to the stop is taken", () => {
    const taken = { left: -30, top: -30, right: 30, bottom: 30 };
    const [at] = placeTags([{ x: 0, y: 0 }], [{ width: 20, height: 10 }], WIDE, undefined, [taken]);
    const box = { left: at!.x, top: at!.y, right: at!.x + 20, bottom: at!.y + 10 };
    const clear = box.left >= taken.right || box.right <= taken.left || box.top >= taken.bottom || box.bottom <= taken.top;
    expect(clear).toBe(true);
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
      if (!at) return;
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

  it("drops the nights line before it hangs a name far from its stop", () => {
    // Queenstown on the landing Borrow map at 375: boxed in, its name floated 70px off.
    const view = { left: -60, top: -60, right: 60, bottom: 60 };
    const pins = [{ x: 0, y: 0 }, { x: 0, y: 40 }];
    const [at] = placeTags(pins, [{ width: 40, height: 28, short: { width: 40, height: 15 } }], view, pins, [
      { left: -60, top: -60, right: 60, bottom: -12 },
      { left: -60, top: 12, right: 60, bottom: 60 },
    ]);
    expect(at).toMatchObject({ short: true });
  });

  it("leaves a name out rather than hang it far from its stop", () => {
    const blocked = [{ left: -200, top: -200, right: 200, bottom: 200 }];
    expect(placeTags([{ x: 0, y: 0 }], [tag], WIDE, undefined, blocked)).toEqual([null]);
  });
});

describe("covered", () => {
  const name = { left: 0, top: 0, right: 80, bottom: 28 };

  it("names each mark a name sits on", () => {
    const under = { left: 40, top: 20, right: 66, bottom: 40 };
    const clear = { left: 100, top: 0, right: 126, bottom: 20 };
    expect(covered([under, null, clear], [name])).toEqual(new Set([0]));
  });

  it("leaves a mark that only touches a name's edge", () => {
    expect(covered([{ left: 80, top: 0, right: 100, bottom: 20 }], [name]).size).toBe(0);
  });
});

describe("crowded", () => {
  const at = (x: number) => ({ left: x, top: 0, right: x + 30, bottom: 20 });

  it("hides a mark that sits on a mark kept before it", () => {
    expect(crowded([at(0), at(20), at(40)], [], [])).toEqual(new Set([1]));
  });

  it("hides a mark that sits on a dot", () => {
    expect(crowded([at(0), at(100)], [], [{ left: 110, top: 5, right: 120, bottom: 15 }])).toEqual(new Set([1]));
  });

  it("hides a mark under a name, and lets the next mark show", () => {
    expect(crowded([at(0), at(20)], [at(-20)], [])).toEqual(new Set([0]));
  });
});
