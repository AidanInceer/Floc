export type Point = { x: number; y: number };
type Size = { width: number; height: number };
/** A tag's size, and its size with the small line beneath dropped, to try when the full tag finds no room. */
export type TagSize = Size & { short?: Size };
export type Spot = Point & { short?: true };
export type Box = { left: number; top: number; right: number; bottom: number };

// Why: a route pin is 26px across; a tag sits 5px off its ring.
const PIN = 13;
const RING = 18;
const STEP = 18;
// Why: past this a reader no longer ties a name to its stop, so the name is cut short or left out instead.
const REACH = 56;
const MARGIN = 2;
const SAMPLE = 4;

const boxAt = (p: Point, s: Size): Box => ({ left: p.x, top: p.y, right: p.x + s.width, bottom: p.y + s.height });
const pinBox = (p: Point): Box => ({ left: p.x - PIN, top: p.y - PIN, right: p.x + PIN, bottom: p.y + PIN });
const grow = (b: Box, by: number): Box => ({ left: b.left - by, top: b.top - by, right: b.right + by, bottom: b.bottom + by });
const inside = (b: Box, p: Point) => p.x > b.left && p.x < b.right && p.y > b.top && p.y < b.bottom;
const gap = (b: Box, p: Point) => Math.hypot(Math.max(b.left - p.x, 0, p.x - b.right), Math.max(b.top - p.y, 0, p.y - b.bottom));

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
 * A tag keeps clear of every pin, of the tags before it, of any `avoid` box and of the clear part's edge, and off the line where it can.
 * Why: a tag far from its pin names no stop, so with no room in reach it tries its short size, then is left out (null).
 */
export function placeTags(pins: Point[], sizes: TagSize[], view: Box, route: Point[] = pins, avoid: Box[] = []): (Spot | null)[] {
  const blocks = [...pins.map(pinBox), ...avoid];
  const line = routeSamples(route);
  const placed: Box[] = [];
  return sizes.map((full, i) => {
    const pin = pins[i] as Point;
    const others = [...blocks.filter((_, j) => j !== i), ...placed];
    const score = (size: Size) => (at: Point) => {
      const raw = boxAt({ x: pin.x + at.x, y: pin.y + at.y }, size);
      const box = grow(raw, MARGIN);
      const hard = others.reduce((sum, b) => sum + overlap(box, b), 0);
      const out = size.width * size.height - overlap(raw, view);
      // Why: a reader gives a name to the nearest pin, so a tag nearer another stop names the wrong place.
      const own = gap(raw, pin);
      const misread = own === 0 || own > REACH || pins.some((p, j) => j !== i && gap(raw, p) < own) ? size.width * size.height : 0;
      return { hard: hard + out + misread, soft: line.filter((p) => inside(box, p)).length };
    };
    const find = (size: Size) => bestSpot(size, (at) => within(pin, size, view, at), score(size));
    const long = find(full);
    const [at, size] = long || !full.short ? [long, full] : [find(full.short), full.short];
    if (!at) return null;
    placed.push(boxAt({ x: pin.x + at.x, y: pin.y + at.y }, size));
    return size === full ? at : { ...at, short: true as const };
  });
}

/** Which marks a name sits on. Why: a name with no clear spot falls back onto a leg's mark, and the name says more. */
export function covered(marks: (Box | null)[], names: Box[]): Set<number> {
  return new Set(marks.flatMap((m, k) => (m && names.some((n) => overlap(m, n) > 0) ? [k] : [])));
}

/** Which marks to leave out: one under a name, one on a dot, or one on a mark kept before it. Why: two marks stacked read as neither. */
export function crowded(marks: (Box | null)[], names: Box[], dots: Box[]): Set<number> {
  const out = covered(marks, names);
  const kept: Box[] = [];
  marks.forEach((m, k) => {
    if (!m || out.has(k)) return;
    if ([...dots, ...kept].some((b) => overlap(m, b) > 0)) out.add(k);
    else kept.push(m);
  });
  return out;
}

/** Why: with no clear spot the least overlap can still run off the map; a name cut at the edge is worse than one nudged along. */
function within(pin: Point, size: Size, view: Box, at: Point): Point {
  const slide = (lo: number, hi: number, from: number, len: number) => (hi - lo < len ? from : Math.min(Math.max(from, lo), hi - len));
  return {
    x: slide(view.left, view.right, pin.x + at.x, size.width) - pin.x,
    y: slide(view.top, view.bottom, pin.y + at.y, size.height) - pin.y,
  };
}

/** The nearest ring with a clear spot wins, the least line covered within it; none clear within reach, none at all. Each spot is scored where `place` puts it, so a slide never lands on a tag. */
function bestSpot(size: Size, place: (at: Point) => Point, score: (at: Point) => { hard: number; soft: number }): Point | null {
  for (let r = RING; r <= REACH; r += STEP) {
    const scored = spots(size, r).map((spot) => {
      const at = place(spot);
      return { at, ...score(at) };
    });
    const clear = scored.filter((s) => s.hard === 0).sort((a, b) => a.soft - b.soft)[0];
    if (clear) return clear.at;
  }
  return null;
}
