export function nearestSlide(starts: number[], scrollLeft: number): number {
  let best = 0;
  starts.forEach((start, i) => {
    if (Math.abs(start - scrollLeft) < Math.abs(starts[best] - scrollLeft)) best = i;
  });
  return best;
}

export function stepSlide(current: number, delta: number, count: number): number {
  return count > 0 ? ((current + delta) % count + count) % count : 0;
}

export function filmPosition(current: number, target: number, count: number): number {
  const next = stepSlide(target, 0, count);
  if (current === 0 && next === count - 1) return 0;
  if (current === count - 1 && next === 0) return count + 1;
  return next + 1;
}
