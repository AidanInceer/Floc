export type Point = [number, number];

/** The route drawn up to `progress` (0–1). Each leg takes an equal share of the time; a stop shows once the line reaches it. */
export function routeAt(points: readonly Point[], progress: number): { path: Point[]; shown: number } {
  const legs = points.length - 1;
  if (legs <= 0 || progress >= 1) return { path: [...points], shown: points.length };
  const at = Math.max(0, progress) * legs;
  const leg = Math.floor(at);
  const [a, b] = [points[leg] as Point, points[leg + 1] as Point];
  const t = at - leg;
  const tip: Point = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  return { path: [...points.slice(0, leg + 1), tip], shown: leg + 1 };
}
