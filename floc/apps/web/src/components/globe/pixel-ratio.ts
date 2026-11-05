/** Sent on `window` when `--canvas-zoom` changes, so a canvas that is not resized redraws at the new sharpness. */
export const CANVAS_ZOOM_EVENT = "floc:canvas-zoom";

/** A page that shows a canvas larger or smaller than its CSS size (a `zoom` on an ancestor) names the factor in `--canvas-zoom`. */
export function canvasZoom(raw: string): number {
  const zoom = Number.parseFloat(raw);
  return zoom > 0 ? zoom : 1;
}

type Rect = { left: number; top: number; right: number; bottom: number };

/** A rectangle read from the page (`getBoundingClientRect`) is in zoomed pixels; the canvas draws in its own, so divide the zoom out. */
export function unzoomed(rect: Rect, zoom: number): Rect {
  return { left: rect.left / zoom, top: rect.top / zoom, right: rect.right / zoom, bottom: rect.bottom / zoom };
}

/** Canvas pixels per CSS pixel. A zoomed canvas needs more, or its map and names are stretched and soft; two is the cap. */
export function pixelRatio(device: number, zoom: number): number {
  return Math.min(2, device * zoom);
}
