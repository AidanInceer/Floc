/** A rolling tile changes its words this often. Slow on purpose: a calm reel, not a flicker. */
export const TICK = 340;

const WAVE = 60;
const HOLD = 0.7;

/**
 * Which face a rolling tile is on at `elapsed` ms into a spin; 0 is the trip it started with.
 * Why: each tile ticks a little after the one before, so the six move as a wave, and none
 * changes just before it stops, so the last roll is the real trip and not a stutter.
 */
export function reelTick(slot: number, stopAt: number, elapsed: number): number {
  const t = Math.min(elapsed, stopAt - TICK * HOLD) - slot * WAVE;
  return Math.max(0, Math.floor(t / TICK) + 1);
}
