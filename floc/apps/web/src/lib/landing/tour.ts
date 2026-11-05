export type Box = { left: number; top: number; width: number; height: number };

export function stepSlide(current: number, delta: number, count: number): number {
  return (((current + delta) % count) + count) % count;
}

/** A sideways swipe steps the tour; a short or mostly vertical move is left to the page scroll. */
export function swipeStep(dx: number, dy: number): -1 | 0 | 1 {
  if (Math.abs(dx) <= 50 || Math.abs(dx) <= Math.abs(dy) * 1.5) return 0;
  return dx < 0 ? 1 : -1;
}

/** Where the colour wipe starts, in the stage's own coordinates: the pressed control's centre, else the stage foot. */
export function wipeOrigin(stage: Box, from: Box | null): { x: number; y: number } {
  if (!from) return { x: stage.width / 2, y: stage.height };
  return { x: from.left + from.width / 2 - stage.left, y: from.top + from.height / 2 - stage.top };
}

/** The circle radius that covers the whole stage from the wipe's origin. */
export function wipeReach(origin: { x: number; y: number }, stage: { width: number; height: number }): number {
  const dx = Math.max(origin.x, stage.width - origin.x);
  const dy = Math.max(Math.abs(origin.y), Math.abs(stage.height - origin.y));
  return Math.hypot(dx, dy) + 40;
}
