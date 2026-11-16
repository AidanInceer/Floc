import type { Box } from "@/components/explore/atlas/tag-place";
import type { LatLng } from "@floc/globe/sphere";

export type Fit = { R: number; cx: number; cy: number };

const RISE = 40;
const WIDE = 0.42;
const SMALLEST = 250;
const SKY = 16;

const TILT = 70;

export const over = (place: LatLng): LatLng => ({ lng: place.lng, lat: Math.max(-TILT, place.lat - RISE) });

export function domeFit(width: number, clear: Box): Fit {
  const R = Math.max(width * WIDE, SMALLEST);
  return { R, cx: (clear.left + clear.right) / 2, cy: clear.top + SKY + R };
}

export const zoomed = (fit: Fit, zoom: number): Fit => ({ R: fit.R * zoom, cx: fit.cx, cy: fit.cy - fit.R + fit.R * zoom });

export const ZOOMS = [1, 1.5, 2.25] as const;

const FINE_FROM = 1.8;

export const fineAt = (fit: Fit, dome: Fit) => fit.R >= dome.R * FINE_FROM;
