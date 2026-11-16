export const TICK = 340;

const WAVE = 60;
const HOLD = 0.7;

export function reelTick(slot: number, stopAt: number, elapsed: number): number {
  const t = Math.min(elapsed, stopAt - TICK * HOLD) - slot * WAVE;
  return Math.max(0, Math.floor(t / TICK) + 1);
}
