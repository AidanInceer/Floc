export function nearestSlide(starts: number[], scrollLeft: number): number {
  let best = 0;
  starts.forEach((start, i) => {
    if (Math.abs(start - scrollLeft) < Math.abs(starts[best] - scrollLeft)) best = i;
  });
  return best;
}

export function stepSlide(current: number, delta: number, count: number): number {
  return Math.max(0, Math.min(count - 1, current + delta));
}
