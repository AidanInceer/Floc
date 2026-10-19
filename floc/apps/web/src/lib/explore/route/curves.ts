import type { TransportType } from "@floc/core/vocabulary";

export type Point = { x: number; y: number };
type Mode = TransportType | null;

/** How far off the straight line a crossing bows at its middle, as a share of its length. */
const ARC: Partial<Record<TransportType, number>> = { flight: 0.3, ferry: 0.2 };
const RAD = Math.PI / 180;
/** The turn of a road or rail line at a stop with no road or rail beyond it. */
const TURN = 15 * RAD;
const HUG = 0.32;
// Why: a leg between two others would run near straight; a small lean outwards keeps the line flowing. The stop's dot hides the join.
const LEAN = 10 * RAD;
/** Below this share of its length, a leg is taken to run through the middle of the trip: it keeps the bend of the leg before. */
const THROUGH = 0.06;

const sub = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y });
const add = (a: Point, b: Point): Point => ({ x: a.x + b.x, y: a.y + b.y });
const mul = (a: Point, k: number): Point => ({ x: a.x * k, y: a.y * k });
const len = (a: Point) => Math.hypot(a.x, a.y);
const unit = (a: Point): Point => mul(a, 1 / (len(a) || 1));
const turn = (a: Point, t: number): Point => ({ x: a.x * Math.cos(t) - a.y * Math.sin(t), y: a.x * Math.sin(t) + a.y * Math.cos(t) });
const onGround = (mode: Mode) => !mode || !(mode in ARC);
const middle = (ps: readonly Point[]): Point => mul(ps.reduce((sum, p) => add(sum, p), { x: 0, y: 0 }), 1 / ps.length);

function cubic(p0: Point, c1: Point, c2: Point, p1: Point, n: number): Point[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const u = 1 - t;
    const [a, b, c, d] = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
    return { x: a * p0.x + b * c1.x + c * c2.x + d * p1.x, y: a * p0.y + b * c1.y + c * c2.y + d * p1.y };
  });
}

/**
 * Why: a centripetal Catmull-Rom handle. The plain one overshoots where a long leg meets a short one or the route turns hard
 * (a ring road balloons out to sea); this one stays tight to the stops and never loops.
 */
function handle(p0: Point, p1: Point, p2: Point): Point {
  const d1 = Math.sqrt(len(sub(p1, p0))) || 1e-6;
  const d2 = Math.sqrt(len(sub(p2, p1))) || 1e-6;
  const k = 3 * d1 * (d1 + d2);
  const w = 2 * d1 * d1 + 3 * d1 * d2 + d2 * d2;
  return { x: (d1 * d1 * p2.x - d2 * d2 * p0.x + w * p1.x) / k, y: (d1 * d1 * p2.y - d2 * d2 * p0.y + w * p1.y) / k };
}

/** Which way each leg bends: away from the middle of the trip. */
function sidesOf(stops: readonly Point[], legs: number): number[] {
  const mid = middle(stops);
  let side = 1;
  return Array.from({ length: legs }, (_, i) => {
    const [a, b] = [stops[i]!, stops[i + 1]!];
    const d = sub(b, a);
    const s = (-d.y * ((a.x + b.x) / 2 - mid.x) + d.x * ((a.y + b.y) / 2 - mid.y)) / (len(d) || 1);
    if (Math.abs(s) > THROUGH * len(d)) side = Math.sign(s);
    return side;
  });
}

/**
 * The line from each stop to the next. A drive or a train flows through each stop with no corner,
 * a flight or a boat is an arc of its own, and every bend leans away from the middle of the trip.
 */
export function legCurves(stops: readonly Point[], modes: readonly Mode[], n: number): Point[][] {
  const sides = sidesOf(stops, modes.length);
  return modes.map((mode, i) => {
    const [a, b] = [stops[i]!, stops[i + 1]!];
    const d = sub(b, a);
    const L = len(d);
    const dh = unit(d);
    const side = sides[i]!;
    const out = mul({ x: -dh.y, y: dh.x }, side);
    if (!onGround(mode)) {
      const h = (4 / 3) * ARC[mode!]! * L;
      return cubic(a, add(add(a, mul(d, 1 / 3)), mul(out, h)), add(sub(b, mul(d, 1 / 3)), mul(out, h)), b, n);
    }
    const before = i > 0 && onGround(modes[i - 1]!) ? stops[i - 1]! : null;
    const after = i < modes.length - 1 && onGround(modes[i + 1]!) ? stops[i + 2]! : null;
    const c1 = before ? add(a, turn(sub(handle(before, a, b), a), LEAN * side)) : add(a, mul(turn(dh, TURN * side), L * HUG));
    const c2 = after ? add(b, turn(sub(handle(after, b, a), b), -LEAN * side)) : sub(b, mul(turn(dh, -TURN * side), L * HUG));
    return cubic(a, c1, c2, b, n);
  });
}

/** A day out: a loop that leaves `at` in the direction `away`, reaches about `size` px and comes back. */
export function loopCurve(at: Point, away: Point, size: number, n: number): Point[] {
  const dir = unit(away);
  const reach = size * 1.26;
  return cubic(at, add(at, mul(turn(dir, 0.6), reach)), add(at, mul(turn(dir, -0.6), reach)), at, n);
}
