import type { Box } from "@/components/explore/atlas/tag-place";
import type { LatLng } from "@/lib/landing/globe/sphere";

/** Where the sphere sits on the canvas: its radius and its middle, in px. */
export type Fit = { R: number; cx: number; cy: number };

// Why: a place this far above the sphere's middle lands on the part of the dome that shows.
const RISE = 40;
const WIDE = 0.42;
const SMALLEST = 250;
const SKY = 16;

// The furthest north or south a drag turns the globe (`globeDrag`); a view past it would jump on the first drag.
const TILT = 70;

/** The view that stands a place on top of the dome. */
export const over = (place: LatLng): LatLng => ({ lng: place.lng, lat: Math.max(-TILT, place.lat - RISE) });

/** Every trip: a sphere so wide that only its top shows, rising in the part of the band the card leaves clear. */
export function domeFit(width: number, clear: Box): Fit {
  const R = Math.max(width * WIDE, SMALLEST);
  return { R, cx: (clear.left + clear.right) / 2, cy: clear.top + SKY + R };
}

// Why: on the dome the 1:110m outline is finer than a pixel can show, and the whole face is in view, so 1:50m would cost each frame for nothing.
const FINE_FROM = 1.8;

/** Whether the globe, drawn at `fit`, is far enough in from the dome for the 1:50m outline. */
export const fineAt = (fit: Fit, dome: Fit) => fit.R >= dome.R * FINE_FROM;
