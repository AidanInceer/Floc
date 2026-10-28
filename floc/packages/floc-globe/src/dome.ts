/** The box a globe is drawn in, in px. */
export type Size = { w: number; h: number };
/** Where the sphere sits in the box: its radius and its middle, in px. */
export type Fit = { R: number; cx: number; cy: number };

// The same dome as Explore's: wider than the box, so only its top shows.
const WIDE = 0.42;
const SMALLEST = 240;
const SKY = 16;
const GAP = 8;
const DEEPEST = 14;

const restR = ({ w }: Size) => Math.max(w * WIDE, SMALLEST);
const wholeR = ({ w, h }: Size) => Math.min(w, h) / 2 - GAP;

/** How far the globe zooms, as a multiple of the dome at rest: out to the whole globe, in to fourteen times that. */
export function zoomRange(box: Size) {
  if (wholeR(box) <= 0) return { min: 1, max: 1 };
  const k = wholeR(box) / restR(box);
  return { min: Math.min(1, k), max: DEEPEST * k };
}

/**
 * The sphere at zoom `k` (1 is the dome at rest).
 * Why the middle moves: zooming out from the dome lowers the sphere's middle to the box's, so the whole globe ends up in view.
 */
export function domeAt(box: Size, k: number): Fit {
  const R0 = restR(box);
  const { min } = zoomRange(box);
  const sunk = min >= 1 ? 1 : Math.min(1, Math.max(0, (k - min) / (1 - min)));
  return { R: R0 * k, cx: box.w / 2, cy: box.h / 2 + (SKY + R0 - box.h / 2) * sunk };
}
