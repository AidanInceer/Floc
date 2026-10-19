import type { Box } from "@/components/explore/atlas/tag-place";
import { zoomFor } from "@/lib/landing/globe/deep";
import { apart, type LatLng } from "@/lib/landing/globe/sphere";

/** Where the sphere sits on the canvas: its radius and its middle, in px. */
export type Fit = { R: number; cx: number; cy: number };

// Why: a place this far above the sphere's middle lands on the part of the dome that shows.
const RISE = 40;
const WIDE = 0.42;
const SMALLEST = 250;
const SKY = 16;
// Past these an inland trip has no coast or border left in view (see `deepFrame`).
const CLOSEST = { wide: 3200, narrow: 2600 };
const NARROW_BELOW = 600;

// The furthest north or south a drag turns the globe (`globeDrag`); a view past it would jump on the first drag.
const TILT = 70;

/** The view that stands a place on top of the dome. */
export const over = (place: LatLng): LatLng => ({ lng: place.lng, lat: Math.max(-TILT, place.lat - RISE) });

/** Every trip: a sphere so wide that only its top shows, rising in the part of the band the card leaves clear. */
export function domeFit(width: number, clear: Box): Fit {
  const R = Math.max(width * WIDE, SMALLEST);
  return { R, cx: (clear.left + clear.right) / 2, cy: clear.top + SKY + R };
}

/** One trip: far enough in that its stops spread over the clear part, looking at the middle of the route. */
export function routeFit(stops: readonly LatLng[], clear: Box): { fit: Fit; view: LatLng } {
  const [w, h] = [clear.right - clear.left, clear.bottom - clear.top];
  const [lats, lngs] = [stops.map((s) => s.lat), stops.map((s) => s.lng)];
  const closest = w < NARROW_BELOW ? CLOSEST.narrow : CLOSEST.wide;
  return {
    fit: { R: zoomFor([...stops], Math.min(h * 0.32, w * 0.3), closest), cx: (clear.left + clear.right) / 2, cy: (clear.top + clear.bottom) / 2 },
    view: { lat: (Math.min(...lats) + Math.max(...lats)) / 2, lng: (Math.min(...lngs) + Math.max(...lngs)) / 2 },
  };
}

// Why: on the dome the 1:110m outline is finer than a pixel can show, and the whole face is in view, so 1:50m would cost each frame for nothing.
const FINE_FROM = 1.8;

/** Whether the globe, drawn at `fit`, is far enough in from the dome for the 1:50m outline. */
export const fineAt = (fit: Fit, dome: Fit) => fit.R >= dome.R * FINE_FROM;

/** The sphere `deep` of the way from the dome to one trip. The radius grows by ratio, which reads as a steady zoom. */
export function fitAt(deep: number, from: Fit, to: Fit): Fit {
  if (deep <= 0) return from;
  if (deep >= 1) return to;
  return { R: from.R * (to.R / from.R) ** deep, cx: from.cx + (to.cx - from.cx) * deep, cy: from.cy + (to.cy - from.cy) * deep };
}

const RAD = Math.PI / 180;
const within = (v: number, limit: number) => Math.min(limit, Math.max(-limit, v));

/**
 * The view that puts `target` at `point` on the canvas, or as near as the sphere's edge allows.
 * Why: the zoom moves a trip in a straight line from its place on the dome to the middle of the map. A turn timed
 * apart from the zoom swings the trip off the screen and back.
 */
export function viewFor(fit: Fit, target: LatLng, point: { x: number; y: number }): LatLng {
  const flat = Math.cos(target.lat * RAD) || 1e-6;
  const across = Math.asin(within((point.x - fit.cx) / (fit.R * flat), 1));
  const [up, out] = [Math.sin(target.lat * RAD), flat * Math.cos(across)];
  const reach = Math.hypot(up, out) || 1;
  const rise = within((fit.cy - point.y) / fit.R, reach);
  return { lng: target.lng - across / RAD, lat: (Math.acos(rise / reach) - Math.atan2(out, up)) / RAD };
}

/** How far along the whole route each stop is, 0 to 1, by distance: the line is then drawn at one speed, not one leg a beat. */
export function legMarks(stops: readonly LatLng[]): number[] {
  const lengths = stops.slice(1).map((stop, k) => apart(stops[k]!, stop));
  const total = lengths.reduce((sum, length) => sum + length, 0);
  let run = 0;
  return [0, ...lengths.map((length, k) => (total ? (run += length) / total : (k + 1) / lengths.length))];
}

/** How much of leg `k` the line has covered when `drawn` of the whole route is drawn. */
export function legPart(drawn: number, marks: readonly number[], k: number): number {
  const [from, to] = [marks[k]!, marks[k + 1]!];
  if (to <= from) return drawn >= from ? 1 : 0;
  return Math.min(1, Math.max(0, (drawn - from) / (to - from)));
}
