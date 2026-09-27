import type { Point } from "./route-crop";

export type Shares = { from: number[]; len: number[] };
export type JourneyFrame = { fill: number[]; reached: boolean[]; drawn: number };

const BEND = 0.16;
const SAMPLES = 24;

/** Where each stop starts on the nights bar, and how much of it it takes, as shares of the whole trip. */
export function journeyShares(nights: number[]): Shares {
  const total = nights.reduce((a, b) => a + b, 0) || 1;
  let before = 0;
  const from = nights.map((n) => {
    const at = before / total;
    before += n;
    return at;
  });
  return { from, len: nights.map((n) => n / total) };
}

function control([x0, y0]: Point, [x1, y1]: Point): Point {
  return [(x0 + x1) / 2 - (y1 - y0) * BEND, (y0 + y1) / 2 + (x1 - x0) * BEND];
}

/** The route as gently bent legs, one quadratic curve per leg. */
export function routePath(points: Point[]): string {
  if (points.length === 0) return "";
  const f = (n: number) => n.toFixed(1);
  let d = `M${f(points[0][0])} ${f(points[0][1])}`;
  for (let i = 1; i < points.length; i++) {
    const [cx, cy] = control(points[i - 1], points[i]);
    d += ` Q${f(cx)} ${f(cy)} ${f(points[i][0])} ${f(points[i][1])}`;
  }
  return d;
}

function legLength(a: Point, b: Point) {
  const c = control(a, b);
  let length = 0;
  let prev = a;
  for (let s = 1; s <= SAMPLES; s++) {
    const t = s / SAMPLES;
    const u = 1 - t;
    const next: Point = [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]];
    length += Math.hypot(next[0] - prev[0], next[1] - prev[1]);
    prev = next;
  }
  return length;
}

/** Distance along `routePath` to each stop, starting at 0. */
export function routeLengths(points: Point[]): number[] {
  const lengths = [0];
  for (let i = 1; i < points.length; i++) lengths.push(Math.round((lengths[i - 1] + legLength(points[i - 1], points[i])) * 100) / 100);
  return lengths;
}

const clamp = (n: number) => Math.min(1, Math.max(0, n));

/**
 * One clock for the bar and the map: at progress `p`, how full each stop's bar
 * is, which stops are reached, and how far along the route the line is drawn.
 * The line arrives at a stop exactly when the bar reaches that stop's first night.
 */
export function journeyAt(p: number, { from, len }: Shares, lengths: number[]): JourneyFrame {
  const total = lengths.at(-1) ?? 0;
  let drawn = total;
  for (let k = 0; k < from.length - 1; k++) {
    if (p < from[k + 1]) {
      drawn = lengths[k] + (lengths[k + 1] - lengths[k]) * clamp((p - from[k]) / len[k]);
      break;
    }
  }
  return {
    fill: from.map((f, k) => clamp((p - f) / len[k])),
    reached: from.map((f) => p >= f),
    drawn,
  };
}

export const easeInOut = (x: number) => 0.5 - Math.cos(Math.PI * x) / 2;
