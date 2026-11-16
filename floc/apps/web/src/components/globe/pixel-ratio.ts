export const CANVAS_ZOOM_EVENT = "floc:canvas-zoom";

export function canvasZoom(raw: string): number {
  const zoom = Number.parseFloat(raw);
  return zoom > 0 ? zoom : 1;
}

type Rect = { left: number; top: number; right: number; bottom: number };

export function unzoomed(rect: Rect, zoom: number): Rect {
  return { left: rect.left / zoom, top: rect.top / zoom, right: rect.right / zoom, bottom: rect.bottom / zoom };
}

export function pixelRatio(device: number, zoom: number): number {
  return Math.min(2, device * zoom);
}
