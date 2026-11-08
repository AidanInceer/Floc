export type Box = { w: number; h: number };
export type Frame = { R: number; cx: number; cy: number };
/** Where the sphere sits in the canvas. Left out, it fills the canvas; the way in to a trip makes it far larger. */
export type Fit = (box: Box) => Frame | undefined;

/** Why: a canvas with no size yet gives a radius of -2, and `arc` throws on a negative radius (#527). */
export function globeFrame(box: Box, fit?: Fit): Frame {
  const frame = fit?.(box) ?? { R: Math.min(box.w, box.h) / 2 - 2, cx: box.w / 2, cy: box.h / 2 };
  return { ...frame, R: Math.max(0, frame.R) };
}
