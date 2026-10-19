type Point = { x: number; y: number };

/** A drawn ring with no two points nearer than `gap` px: a 1:50m coast holds many points to a pixel when drawn small. */
export function thin<P extends Point>(points: readonly P[], gap: number): P[] {
  if (points.length < 3) return [...points];
  const out = [points[0]!];
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i]!;
    const last = out[out.length - 1]!;
    if (Math.hypot(p.x - last.x, p.y - last.y) >= gap) out.push(p);
  }
  out.push(points[points.length - 1]!);
  return out;
}
