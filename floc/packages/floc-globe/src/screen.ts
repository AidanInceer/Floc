import type { Fit, Size } from "./dome";
import { project, unproject, type LatLng } from "./sphere";

export type Point = { x: number; y: number };

const RAD = Math.PI / 180;
const TILT = 70;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Where a place lands on the screen, and whether it is on the side facing you. */
export function spotOf(view: LatLng, { R, cx, cy }: Fit, place: LatLng) {
  const q = project(view, place);
  return { x: cx + R * q.x, y: cy - R * q.y, front: q.z > 0 };
}

/** The place under a point on the screen, or null off the edge of the sphere. */
export function placeAt(view: LatLng, { R, cx, cy }: Fit, { x, y }: Point): LatLng | null {
  const [u, v] = [(x - cx) / R, (cy - y) / R];
  return Math.hypot(u, v) > 1 ? null : unproject(view, u, v);
}

/** The view that puts `place` at point `p`: a few small drags, each moving the place by what is left. */
export function aimAt(from: LatLng, fit: Fit, place: LatLng, p: Point): LatLng {
  let view = { ...from };
  for (let i = 0; i < 8; i++) {
    const s = spotOf(view, fit, place);
    if (!s.front) {
      view = { lng: place.lng, lat: clamp(place.lat, -TILT, TILT) };
      continue;
    }
    const k = 1 / (fit.R * RAD);
    view = {
      lng: view.lng - ((p.x - s.x) * k) / Math.max(0.35, Math.cos(view.lat * RAD)),
      lat: clamp(view.lat + (p.y - s.y) * k, -TILT, TILT),
    };
  }
  return view;
}

const MARGIN = 8;
const LIFT = 12;

/** Where a bubble centred above `spot` sits so all of it stays in the box. */
export function keepIn(spot: Point, box: Size, bubble: Size): Point {
  const half = bubble.w / 2 + MARGIN;
  return { x: clamp(spot.x, half, box.w - half), y: Math.max(spot.y, bubble.h + LIFT + MARGIN) };
}
