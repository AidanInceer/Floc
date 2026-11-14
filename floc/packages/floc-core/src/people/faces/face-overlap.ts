/** How far a stacked face tucks under the one before, web and phone. Why a seventh: a fixed or larger overlap covered the second initial. */
export function faceOverlap(size: number): number {
  return -Math.round(size / 7);
}
