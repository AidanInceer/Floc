type Point = { x: number; y: number };

const EASE = 5;
const tenth = (value: number) => Math.round(value * 10) / 10;
const at = (p: Point) => `${tenth(p.x)} ${tenth(p.y)}`;

function toward(from: Point, to: Point): Point {
  const length = Math.hypot(to.x - from.x, to.y - from.y) || 1;
  const t = Math.min(0.5, EASE / length);
  return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
}

/**
 * One closed ring as an SVG path. `points` repeats its first point at the end, as GeoJSON does.
 * Each corner is eased by a few pixels, so a coarse coast reads as drawn and a long straight border stays straight.
 */
export function ringPath(points: readonly Point[]): string {
  const corners = points.length - 1;
  if (corners < 3) return "";
  let d = "";
  for (let i = 0; i < corners; i++) {
    const corner = points[i]!;
    const from = toward(corner, points[(i - 1 + corners) % corners]!);
    const to = toward(corner, points[(i + 1) % corners]!);
    d += `${i ? "L" : "M"}${at(from)}Q${at(corner)} ${at(to)}`;
  }
  return `${d}Z`;
}
