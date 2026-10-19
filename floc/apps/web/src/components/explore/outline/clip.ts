type Point = { x: number; y: number };
type View = { left: number; top: number; right: number; bottom: number };
type Edge = { inside: (p: Point) => boolean; cross: (a: Point, b: Point) => Point };

const along = (a: Point, b: Point, t: number): Point => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
const atX = (x: number) => (a: Point, b: Point) => ({ ...along(a, b, (x - a.x) / (b.x - a.x)), x });
const atY = (y: number) => (a: Point, b: Point) => ({ ...along(a, b, (y - a.y) / (b.y - a.y)), y });

function edgesOf(v: View): Edge[] {
  return [
    { inside: (p) => p.x >= v.left, cross: atX(v.left) },
    { inside: (p) => p.x <= v.right, cross: atX(v.right) },
    { inside: (p) => p.y >= v.top, cross: atY(v.top) },
    { inside: (p) => p.y <= v.bottom, cross: atY(v.bottom) },
  ];
}

function cut(points: Point[], { inside, cross }: Edge): Point[] {
  const out: Point[] = [];
  points.forEach((p, i) => {
    const q = points[(i + points.length - 1) % points.length]!;
    if (inside(p) !== inside(q)) out.push(cross(q, p));
    if (inside(p)) out.push(p);
  });
  return out;
}

/**
 * The part of a closed ring inside `view`, closed again; empty when none of it is.
 * Why: a neighbour as big as Russia would otherwise draw its whole coast, off the drawing, into every small map.
 */
export function clipRing(ring: readonly Point[], view: View): Point[] {
  let open = ring.slice(0, -1);
  for (const edge of edgesOf(view)) {
    if (open.length === 0) return [];
    open = cut(open, edge);
  }
  return open.length < 3 ? [] : [...open, open[0]!];
}
