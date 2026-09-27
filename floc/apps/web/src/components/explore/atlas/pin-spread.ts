type Point = { x: number; y: number };

const ROUNDS = 60;

/** Pins moved apart just enough that no two are closer than `min`; pins already clear stay put. */
export function spread(pins: readonly Point[], min: number): Point[] {
  const out = pins.map((p) => ({ ...p }));
  for (let round = 0; round < ROUNDS; round++) {
    let moved = false;
    for (let i = 0; i < out.length; i++) {
      for (let j = i + 1; j < out.length; j++) moved = pushApart(out[i] as Point, out[j] as Point, min) || moved;
    }
    if (!moved) break;
  }
  return out;
}

function pushApart(a: Point, b: Point, min: number): boolean {
  const [dx, dy] = [b.x - a.x, b.y - a.y];
  const d = Math.hypot(dx, dy);
  if (d >= min - 1e-6) return false;
  // Why: two pins on one spot have no direction between them; side by side reads best.
  const [ux, uy] = d === 0 ? [1, 0] : [dx / d, dy / d];
  const half = (min - d) / 2;
  a.x -= ux * half;
  a.y -= uy * half;
  b.x += ux * half;
  b.y += uy * half;
  return true;
}
