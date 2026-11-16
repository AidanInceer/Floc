export type Box = { w: number; h: number };
export type Frame = { R: number; cx: number; cy: number };
export type Fit = (box: Box) => Frame | undefined;

export function globeFrame(box: Box, fit?: Fit): Frame {
  const frame = fit?.(box) ?? { R: Math.min(box.w, box.h) / 2 - 2, cx: box.w / 2, cy: box.h / 2 };
  return { ...frame, R: Math.max(0, frame.R) };
}
