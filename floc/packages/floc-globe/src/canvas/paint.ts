import { limbRing, shortest, type LatLng } from "../sphere";

/** Where the sphere sits in its box: its radius and its middle, in px. */
export type Fit = { R: number; cx: number; cy: number };

const RAD = Math.PI / 180;

/**
 * Traces one land outline as seen from `view`. False when all of it is behind the globe.
 * Why the edge: land that runs behind is cut where it crosses the edge and followed along it; a straight line between the two crossings draws a flat side.
 */
export function traceRing(ctx: CanvasRenderingContext2D, { R, cx, cy }: Fit, view: LatLng, ring: number[][]): boolean {
  const out = limbRing(view, ring);
  if (!out) return false;
  ctx.beginPath();
  out.forEach((q, k) => {
    const p = out[(k + out.length - 1) % out.length]!;
    if ("x" in q) {
      const [x, y] = [cx + R * q.x, cy - R * q.y];
      return k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    if (k && "a" in p) return ctx.arc(cx, cy, R, -p.a, -q.a, shortest((q.a - p.a) / RAD) > 0);
    const [x, y] = [cx + R * Math.cos(q.a), cy - R * Math.sin(q.a)];
    return k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  });
  ctx.closePath();
  return true;
}
