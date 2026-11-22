import type { Box } from "@/components/explore/atlas/tag-place";
import type { LatLng } from "@floc/globe/sphere";

export type Fit = { R: number; cx: number; cy: number };

const RISE = 40;
const SHOWN = 0.5;
const SMALLEST = 250;
const SKY = 16;
const NORTH = 89;
const RAD = Math.PI / 180;

const TILT = 70;
const EASE_BAND = 10;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export const over = (place: LatLng): LatLng => ({ lng: place.lng, lat: Math.max(-TILT, place.lat - RISE) });

export function riseFor(view: LatLng, place: LatLng): number {
  const low = clamp(place.lat + TILT, 0, RISE);
  return low + (RISE - low) * clamp((view.lat + TILT) / EASE_BAND, 0, 1);
}

export function domeFit(clear: Box): Fit {
  const R = Math.max((clear.bottom - clear.top - SKY) / (2 * SHOWN), SMALLEST);
  return { R, cx: (clear.left + clear.right) / 2, cy: clear.top + SKY + R };
}

export const ZOOMS = [1, 1.5, 2.25] as const;

const PEAK = ZOOMS[ZOOMS.length - 1];
const flatness = (zoom: number) => clamp((zoom - 1) / (PEAK - 1), 0, 1);

export const lift = (view: LatLng, zoom: number, rise = RISE): LatLng => {
  const t = flatness(zoom);
  return t === 0 ? view : { lng: view.lng, lat: Math.min(NORTH, view.lat + rise * t) };
};

export function zoomed(fit: Fit, zoom: number, clear: Box, rise = RISE): Fit {
  const t = flatness(zoom);
  const R = fit.R * zoom;
  const from = fit.cy - fit.R * Math.sin(rise * RAD);
  const place = from + ((clear.top + clear.bottom) / 2 - from) * t;
  return { R, cx: fit.cx, cy: place + R * Math.sin(rise * (1 - t) * RAD) };
}

const FINE_FROM = 1.8;

export const fineAt = (fit: Fit, dome: Fit) => fit.R >= dome.R * FINE_FROM;
