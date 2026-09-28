export const SWEEP_DELAY_MS = 900;
export const SWEEP_MS = 1900;

const clamp = (x: number) => Math.min(1, Math.max(0, x));
const easeInOut = (p: number) => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2);

/** Where the wiper sits `elapsed` ms into a stage: free first, then across to Pro. */
export function sweepAt(elapsed: number): number {
  return easeInOut(clamp((elapsed - SWEEP_DELAY_MS) / SWEEP_MS));
}

/** Values sit on the right of each row, so a row counts as changed once the wiper reaches the right half. */
export function litAt(x: number, i: number): boolean {
  return x >= 0.55 + i * 0.1 || x >= 0.98;
}

export function wipeAt(clientX: number, left: number, width: number): number {
  return clamp((clientX - left) / width);
}

export function stepWipe(x: number, key: string): number | null {
  if (key === "ArrowLeft") return clamp(x - 0.1);
  if (key === "ArrowRight") return clamp(x + 0.1);
  if (key === "Home") return 0;
  if (key === "End") return 1;
  return null;
}
