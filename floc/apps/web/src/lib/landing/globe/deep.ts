import { easeInOut } from "./flight";
import { apart, type LatLng } from "./sphere";

type Box = { w: number; h: number };
type Point = { x: number; y: number };
type Tween = { from: number; to: number; t0: number; ms: number };

/** How far in the open map sits (`R`, the sphere's radius in px) and where across its box the stop is centred. */
type Cam = { R: number; fx: number };

/** One pin on the open map: a trip can come back to a town, so a pin can carry two stop numbers. */
export type StopPin = LatLng & { stops: number[] };

const RAD = Math.PI / 180;
const PANEL_CORNER = 28;
const FURTHEST = 1400;
const PIN = 15;
const REACH = 18;
const EDGE = 6;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function pinsOf(stops: LatLng[]): StopPin[] {
  const pins: StopPin[] = [];
  stops.forEach(({ lat, lng }, k) => {
    const same = pins.find((p) => p.lat === lat && p.lng === lng);
    if (same) same.stops.push(k);
    else pins.push({ lat, lng, stops: [k] });
  });
  return pins;
}

/**
 * The open map by screen: its height, where across it the stop sits, and the closest zoom.
 * Why: on a wide screen the rail covers the right of the map, so the stop is centred on the part that is clear.
 * Past `max` an inland trip (Banff, Rajasthan) has no coast or border left in view, and the map is a blank sheet.
 */
export const deepFrame = (wide: boolean) => (wide ? { h: 560, fx: 0.34, max: 3200 } : { h: 400, fx: 0.5, max: 2600 });

/** How far from the middle a stop may sit and still be clear of the map's edges and the rail. */
export const roomIn = (box: Box, wide: boolean) => Math.min(box.h * 0.32, box.w * (wide ? 0.24 : 0.34));

/** The sphere's radius for one trip: far enough in that its stops spread over `room` px, within limits. */
export function zoomFor(stops: LatLng[], room: number, max: number): number {
  const [lats, lngs] = [stops.map((p) => p.lat), stops.map((p) => p.lng)];
  const mid = { lat: (Math.min(...lats) + Math.max(...lats)) / 2, lng: (Math.min(...lngs) + Math.max(...lngs)) / 2 };
  const spread = Math.max(...stops.map((p) => apart(mid, p))) * RAD;
  return spread ? clamp((1.5 * room) / spread, FURTHEST, max) : max;
}

/** The corner of the globe's box, `deep` of the way from a circle of radius `half` to a rounded panel. */
export const cornerAt = (deep: number, half: number) => half - (half - PANEL_CORNER) * deep;

/** The smallest sphere that fills a box with rounded corners, when its middle sits `dx` px off the box's. */
export const coverRadius = (box: Box, corner: number, dx: number) =>
  Math.hypot(Math.max(0, box.w / 2 - corner), Math.max(0, box.h / 2 - corner)) + corner + Math.abs(dx);

/**
 * Where the sphere sits in its box, `deep` of the way in. The radius grows by ratio, which reads
 * as a steady zoom, and never drops below the box it must fill, so no corner shows a gap.
 */
export function frameAt(deep: number, box: Box, half: number, cam: Cam) {
  const [cx, cy] = [box.w * (0.5 + (cam.fx - 0.5) * deep), box.h / 2];
  if (deep <= 0) return { R: Math.min(box.w, box.h) / 2 - 2, cx, cy };
  if (deep >= 1) return { R: cam.R, cx, cy };
  const cover = coverRadius(box, cornerAt(deep, half), cx - box.w / 2);
  return { R: Math.max(cover, (half - 2) * (cam.R / (half - 2)) ** deep), cx, cy };
}

export function tweenAt({ from, to, t0, ms }: Tween, now: number) {
  const u = ms ? clamp((now - t0) / ms, 0, 1) : 1;
  return { v: from + (to - from) * easeInOut(u), done: u >= 1 };
}

/**
 * How far to move each pin so that none overlap, in px on a map of radius `R`.
 * Why: two stops can be a few miles apart (Franz Josef and Aoraki). The route line still runs to the true place.
 */
export function nudges(pins: LatLng[], R: number, gap = 27): Point[] {
  const o = pins[0] ?? { lat: 0, lng: 0 };
  const flat = pins.map((p) => ({ x: R * (p.lng - o.lng) * RAD * Math.cos(o.lat * RAD), y: -R * (p.lat - o.lat) * RAD }));
  const at = flat.map((p) => ({ ...p }));
  for (let pass = 0; pass < 4; pass++) {
    for (let j = 0; j < at.length; j++) {
      for (let k = j + 1; k < at.length; k++) push(at[j]!, at[k]!, gap);
    }
  }
  return at.map((p, k) => ({ x: p.x - flat[k]!.x || 0, y: p.y - flat[k]!.y || 0 }));
}

function push(a: Point, b: Point, gap: number) {
  const [dx, dy] = [b.x - a.x, b.y - a.y];
  const d = Math.hypot(dx, dy);
  if (d >= gap) return;
  const [ux, uy] = d > 0.01 ? [dx / d, dy / d] : [1, 0];
  const by = (gap - d) / 2;
  [a.x, a.y, b.x, b.y] = [a.x - ux * by, a.y - uy * by, b.x + ux * by, b.y + uy * by];
}

/** Which side of its pin a stop's name goes on: the first that is inside the map and clear of the other pins. */
export function flagSide(at: number, pts: Point[], flag: Box, box: Box): "r" | "l" | "t" | "b" {
  const { x, y } = pts[at]!;
  const sides = {
    r: { l: x + REACH, t: y - flag.h / 2 },
    l: { l: x - REACH - flag.w, t: y - flag.h / 2 },
    t: { l: x - flag.w / 2, t: y - REACH - flag.h },
    b: { l: x - flag.w / 2, t: y + REACH },
  };
  const clear = ({ l, t }: { l: number; t: number }) => {
    const [r, b] = [l + flag.w, t + flag.h];
    if (l < EDGE || t < EDGE || r > box.w - EDGE || b > box.h - EDGE) return false;
    return !pts.some((p, k) => k !== at && l < p.x + PIN && r > p.x - PIN && t < p.y + PIN && b > p.y - PIN);
  };
  return (["r", "l", "t", "b"] as const).find((side) => clear(sides[side])) ?? "r";
}
