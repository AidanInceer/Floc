// The film is three copies of the slides; you always rest in the middle one, so
// a swipe past either end meets more film, never the edge of the track.
export const FILM_COPIES = 3;

export function nearestSlide(starts: number[], scrollLeft: number): number {
  let best = 0;
  starts.forEach((start, i) => {
    if (Math.abs(start - scrollLeft) < Math.abs(starts[best] - scrollLeft)) best = i;
  });
  return best;
}

export function nearestCopy(from: number, target: number, count: number): number {
  const index = ((target % count) + count) % count;
  let best = count + index;
  for (let copy = 0; copy < FILM_COPIES; copy++) {
    const at = copy * count + index;
    if (Math.abs(at - from) < Math.abs(best - from)) best = at;
  }
  return best;
}

export function recentre(physical: number, count: number): number {
  return count + (physical % count);
}
