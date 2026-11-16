import type { TransportType } from "../../vocabulary";

export type Point = { x: number; y: number };
type Mode = TransportType | null;

const ARC: Partial<Record<TransportType, number>> = { flight: 0.3, ferry: 0.2 };
const RAD = Math.PI / 180;
const TURN = 15 * RAD;
const HUG = 0.32;
const LEAN = 10 * RAD;
const THROUGH = 0.06;
const CLEAR = 0.15;

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

function handle(p0: Point, p1: Point, p2: Point): Point {
  const d1 = Math.sqrt(len(sub(p1, p0))) || 1e-6;
  const d2 = Math.sqrt(len(sub(p2, p1))) || 1e-6;
  const k = 3 * d1 * (d1 + d2);
  const w = 2 * d1 * d1 + 3 * d1 * d2 + d2 * d2;
  return { x: (d1 * d1 * p2.x - d2 * d2 * p0.x + w * p1.x) / k, y: (d1 * d1 * p2.y - d2 * d2 * p0.y + w * p1.y) / k };
}

function sidesOf(stops: readonly Point[], legs: number): number[] {
  const mid = middle(stops);
  let side = 1;
  return Array.from({ length: legs }, (_, i) => {
    const [a, b] = [stops[i], stops[i + 1]];
    const d = sub(b, a);
    const s = (-d.y * ((a.x + b.x) / 2 - mid.x) + d.x * ((a.y + b.y) / 2 - mid.y)) / (len(d) || 1);
    if (Math.abs(s) > THROUGH * len(d)) side = Math.sign(s);
    return side;
  });
}

export function legCurves(stops: readonly Point[], modes: readonly Mode[], n: number): Point[][] {
  const sides = sidesOf(stops, modes.length);
  const curves = modes.map((_, i) => legCurve(stops, modes, i, sides[i], n));
  for (const run of runsOf(modes)) {
    const near = worst(stops, run, (i) => curves[i]);
    if (near >= 1) continue;
    const flipped = [...curves];
    for (const i of run) flipped[i] = legCurve(stops, modes, i, -sides[i], n);
    if (worst(stops, run, (i) => flipped[i]) > near) for (const i of run) curves[i] = flipped[i];
  }
  return curves;
}

function runsOf(modes: readonly Mode[]): number[][] {
  const runs: number[][] = [];
  modes.forEach((mode, i) => {
    const last = runs.at(-1);
    if (onGround(mode) && last && onGround(modes[last[last.length - 1]])) last.push(i);
    else runs.push([i]);
  });
  return runs;
}

function worst(stops: readonly Point[], run: readonly number[], curve: (i: number) => Point[]): number {
  return Math.min(
    ...run.map((i) => {
      const others = stops.filter((_, k) => k !== i && k !== i + 1);
      return clearance(curve(i), others) / (CLEAR * len(sub(stops[i + 1], stops[i])) || 1);
    }),
  );
}

function clearance(leg: readonly Point[], others: readonly Point[]): number {
  let best = Infinity;
  for (const p of leg.slice(1, -1)) for (const q of others) best = Math.min(best, len(sub(p, q)));
  return best;
}

function legCurve(stops: readonly Point[], modes: readonly Mode[], i: number, side: number, n: number): Point[] {
  const [a, b] = [stops[i], stops[i + 1]];
  const d = sub(b, a);
  const L = len(d);
  const dh = unit(d);
  const out = mul({ x: -dh.y, y: dh.x }, side);
  const mode = modes[i];
  const arc = mode ? ARC[mode] : undefined;
  if (arc !== undefined) {
    const h = (4 / 3) * arc * L;
    return cubic(a, add(add(a, mul(d, 1 / 3)), mul(out, h)), add(sub(b, mul(d, 1 / 3)), mul(out, h)), b, n);
  }
  const before = i > 0 && onGround(modes[i - 1]) ? stops[i - 1] : null;
  const after = i < modes.length - 1 && onGround(modes[i + 1]) ? stops[i + 2] : null;
  const c1 = before ? add(a, turn(sub(handle(before, a, b), a), LEAN * side)) : add(a, mul(turn(dh, TURN * side), L * HUG));
  const c2 = after ? add(b, turn(sub(handle(after, b, a), b), -LEAN * side)) : sub(b, mul(turn(dh, -TURN * side), L * HUG));
  return cubic(a, c1, c2, b, n);
}

export function spurCurve(at: Point, away: Point, size: number, n: number): Point[] {
  const tip = add(at, mul(unit(away), size));
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = 1 - Math.abs(1 - (2 * i) / n);
    return add(at, mul(sub(tip, at), t));
  });
}
