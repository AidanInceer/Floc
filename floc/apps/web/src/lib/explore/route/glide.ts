import type { LatLng } from "@/lib/landing/globe/sphere";

export type Point = { x: number; y: number };
/** Where a map can look: a flat drawing, or the globe. `apart` is in the same units as a pose's `w`. */
export type Space<C> = { apart(a: C, b: C): number; mix(a: C, b: C, u: number): C; mean(cs: readonly C[]): C };
/** A view of the map: the place at `at` on the canvas, and how wide the clear part of the canvas is in the map's own units. */
export type Pose<C> = { centre: C; w: number; at: Point };

const RAD = Math.PI / 180;
// Why: how far a long move pulls out. d3's interpolateZoom uses √2; a little more reads as a flight rather than a pan.
const RHO = 1.35;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number) => Math.min(1, Math.max(0, v));

export const plane: Space<Point> = {
  apart: (a, b) => Math.hypot(b.x - a.x, b.y - a.y),
  mix: (a, b, u) => ({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u) }),
  mean: (cs) => ({ x: cs.reduce((s, c) => s + c.x, 0) / cs.length, y: cs.reduce((s, c) => s + c.y, 0) / cs.length }),
};

type Vec = [number, number, number];
const vec = ({ lat, lng }: LatLng): Vec => [Math.cos(lat * RAD) * Math.cos(lng * RAD), Math.cos(lat * RAD) * Math.sin(lng * RAD), Math.sin(lat * RAD)];
const place = ([x, y, z]: Vec): LatLng => ({ lat: Math.asin(Math.max(-1, Math.min(1, z / (Math.hypot(x, y, z) || 1)))) / RAD, lng: Math.atan2(y, x) / RAD });
const angle = (p: Vec, q: Vec) => Math.acos(Math.max(-1, Math.min(1, p[0] * q[0] + p[1] * q[1] + p[2] * q[2])));

/** The globe: distance is the angle between two places, in radians, so a pose's `w` is the clear width over the sphere's radius. */
export const sphere: Space<LatLng> = {
  apart: (a, b) => angle(vec(a), vec(b)),
  mix(a, b, u) {
    const [p, q] = [vec(a), vec(b)];
    const d = angle(p, q);
    if (d < 1e-9) return a;
    const [s0, s1] = [Math.sin((1 - u) * d) / Math.sin(d), Math.sin(u * d) / Math.sin(d)];
    return place([s0 * p[0] + s1 * q[0], s0 * p[1] + s1 * q[1], s0 * p[2] + s1 * q[2]]);
  },
  mean: (cs) => place(cs.map(vec).reduce((s, v) => [s[0] + v[0], s[1] + v[1], s[2] + v[2]], [0, 0, 0])),
};

/**
 * The smooth zoom between two views (van Wijk and Nuij): out a little, across, and in, so a long move never smears.
 * `S` is the length of the path; `pose(t)` the view at fraction `t` of it, which the caller eases.
 */
export function glide<C>(space: Space<C>, a: Pose<C>, b: Pose<C>) {
  const d = space.apart(a.centre, b.centre);
  const [w0, w1] = [a.w, b.w];
  const at = (t: number): Point => ({ x: lerp(a.at.x, b.at.x, t), y: lerp(a.at.y, b.at.y, t) });
  if (d < 1e-9) {
    return { S: Math.abs(Math.log(w1 / w0)) / RHO, pose: (t: number): Pose<C> => ({ centre: a.centre, w: w0 * (w1 / w0) ** t, at: at(t) }) };
  }
  const [r2, r4] = [RHO * RHO, RHO ** 4];
  const b0 = (w1 * w1 - w0 * w0 + r4 * d * d) / (2 * w0 * r2 * d);
  const b1 = (w1 * w1 - w0 * w0 - r4 * d * d) / (2 * w1 * r2 * d);
  const r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0);
  const r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1);
  const S = (r1 - r0) / RHO;
  return {
    S,
    pose(t: number): Pose<C> {
      const s = t * S;
      const u = (w0 / (r2 * d)) * (Math.cosh(r0) * Math.tanh(RHO * s + r0) - Math.sinh(r0));
      return { centre: space.mix(a.centre, b.centre, clamp(u)), w: (w0 * Math.cosh(r0)) / Math.cosh(RHO * s + r0), at: at(t) };
    },
  };
}
