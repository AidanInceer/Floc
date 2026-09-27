export type Point = { x: number; y: number };
export type Size = { width: number; height: number };
export type Box = { left: number; top: number; right: number; bottom: number };

// Why: a route pin is 26px across; a tag sits 5px off its ring.
const PIN = 13;
const RING = 18;
const STEP = 18;
const RINGS = 4;
const MARGIN = 2;
const SAMPLE = 4;

const boxAt = (p: Point, s: Size): Box => ({ left: p.x, top: p.y, right: p.x + s.width, bottom: p.y + s.height });
const pinBox = (p: Point): Box => ({ left: p.x - PIN, top: p.y - PIN, right: p.x + PIN, bottom: p.y + PIN });
const grow = (b: Box, by: number): Box => ({ left: b.left - by, top: b.top - by, right: b.right + by, bottom: b.bottom + by });
const inside = (b: Box, p: Point) => p.x > b.left && p.x < b.right && p.y > b.top && p.y < b.bottom;

function overlap(a: Box, b: Box): number {
  const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return w > 0 && h > 0 ? w * h : 0;
}

/** Spots around a pin, in the order a reader looks: right, left, above, below, then the corners. */
function spots(s: Size, r: number): Point[] {
  const d = r * 0.7;
  const [w, h] = [s.width, s.height];
  return [
    { x: r, y: -h / 2 }, { x: -r - w, y: -h / 2 }, { x: -w / 2, y: -r - h }, { x: -w / 2, y: r },
    { x: d, y: -d - h }, { x: d, y: d }, { x: -d - w, y: -d - h }, { x: -d - w, y: d },
  ];
}

/** Points along the route, so a tag can tell how much of the line it covers. */
function routeSamples(pins: Point[]): Point[] {
  return pins.slice(1).flatMap((b, i) => {
    const a = pins[i] as Point;
    const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / SAMPLE));
    return Array.from({ length: n + 1 }, (_, k) => ({ x: a.x + ((b.x - a.x) * k) / n, y: a.y + ((b.y - a.y) * k) / n }));
  });
}

/**
 * Where each stop's tag goes, as the offset of its top-left corner from the pin.
 * A tag keeps clear of every pin, of the tags before it and of the clear part's edge, and off the line where it can.
 * A tag depends only on the pins and the tags before it, so adding the next one never moves the ones shown.
 */
export function placeTags(pins: Point[], sizes: Size[], view: Box, route: Point[] = pins): Point[] {
  const blocks = pins.map(pinBox);
  const line = routeSamples(route);
  const placed: Box[] = [];
  return sizes.map((size, i) => {
    const pin = pins[i] as Point;
    const others = [...blocks.filter((_, j) => j !== i), ...placed];
    const score = (at: Point) => {
      const raw = boxAt({ x: pin.x + at.x, y: pin.y + at.y }, size);
      const box = grow(raw, MARGIN);
      const hard = others.reduce((sum, b) => sum + overlap(box, b), 0);
      const out = size.width * size.height - overlap(raw, view);
      return { hard: hard + out, soft: line.filter((p) => inside(box, p)).length };
    };
    const best = bestSpot(size, score);
    placed.push(boxAt({ x: pin.x + best.x, y: pin.y + best.y }, size));
    return best;
  });
}

/** The nearest ring with a clear spot wins, the least line covered within it; with none clear, the least overlap. */
function bestSpot(size: Size, score: (at: Point) => { hard: number; soft: number }): Point {
  let fallback = { at: spots(size, RING)[0] as Point, cost: Infinity };
  for (let ring = 0; ring < RINGS; ring++) {
    const scored = spots(size, RING + ring * STEP).map((at) => ({ at, ...score(at) }));
    const clear = scored.filter((s) => s.hard === 0).sort((a, b) => a.soft - b.soft)[0];
    if (clear) return clear.at;
    for (const s of scored) if (s.hard * 1000 + s.soft < fallback.cost) fallback = { at: s.at, cost: s.hard * 1000 + s.soft };
  }
  return fallback.at;
}
