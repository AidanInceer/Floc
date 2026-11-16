import { easeInOut } from "./flight";
import { apart, type LatLng } from "@floc/globe/sphere";

type Box = { w: number; h: number };
type Tween = { from: number; to: number; t0: number; ms: number };

type Cam = { R: number; fx: number; fy?: number };

const RAD = Math.PI / 180;
const PANEL_CORNER = 28;
const FURTHEST = 1400;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export const deepFrame = (wide: boolean) => (wide ? { h: 560, fx: 0.34, max: 3200 } : { h: 440, fx: 0.5, max: 2600 });

export const roomIn = (box: Box, wide: boolean) => Math.min(box.h * 0.32, box.w * (wide ? 0.24 : 0.34));

export function zoomFor(stops: LatLng[], room: number, max: number): number {
  const [lats, lngs] = [stops.map((p) => p.lat), stops.map((p) => p.lng)];
  const mid = { lat: (Math.min(...lats) + Math.max(...lats)) / 2, lng: (Math.min(...lngs) + Math.max(...lngs)) / 2 };
  const spread = Math.max(...stops.map((p) => apart(mid, p))) * RAD;
  return spread ? clamp((1.5 * room) / spread, FURTHEST, max) : max;
}

export const cornerAt = (deep: number, half: number) => half - (half - PANEL_CORNER) * deep;

export const coverRadius = (box: Box, corner: number, dx: number) =>
  Math.hypot(Math.max(0, box.w / 2 - corner), Math.max(0, box.h / 2 - corner)) + corner + Math.abs(dx);

export function frameAt(deep: number, box: Box, half: number, cam: Cam) {
  const [cx, cy] = [box.w * (0.5 + (cam.fx - 0.5) * deep), box.h * (0.5 + ((cam.fy ?? 0.5) - 0.5) * deep)];
  if (deep <= 0) return { R: Math.min(box.w, box.h) / 2 - 2, cx, cy };
  if (deep >= 1) return { R: cam.R, cx, cy };
  const cover = coverRadius(box, cornerAt(deep, half), Math.abs(cx - box.w / 2) + Math.abs(cy - box.h / 2));
  return { R: Math.max(cover, (half - 2) * (cam.R / (half - 2)) ** deep), cx, cy };
}

export function tweenAt({ from, to, t0, ms }: Tween, now: number) {
  const u = ms ? clamp((now - t0) / ms, 0, 1) : 1;
  return { v: from + (to - from) * easeInOut(u), done: u >= 1 };
}
