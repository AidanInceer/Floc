/**
 * The Days columns trading places (ADR-051): a step of one day plays across
 * four slots — the one leaving, the two trading, the one arriving — and the
 * grid's day tracks move from one shape to the other.
 */
export type Trade = { dir: 1 | -1; indices: [number, number, number, number] };

export function tradeFor(from: number, to: number): Trade | null {
  if (Math.abs(to - from) !== 1) return null;
  const low = Math.min(from, to) - 1;
  return { dir: to > from ? 1 : -1, indices: [low, low + 1, low + 2, low + 3] };
}

/** The day tracks before and after, in px for the open day so the grid can interpolate them. */
export function tradeTracks(dir: 1 | -1, focusPx: number) {
  const side = "var(--days-side)";
  const wide = `${focusPx}px`;
  const left = `${side} ${wide} ${side} 0px`;
  const right = `0px ${side} ${wide} ${side}`;
  return dir > 0 ? { before: left, after: right } : { before: right, after: left };
}

/** Which trip-day indices the calendar draws: three at rest, four while a trade plays. */
export function slotIndices(focusIndex: number, trade: Trade | null): number[] {
  return trade ? [...trade.indices] : [focusIndex - 1, focusIndex, focusIndex + 1];
}
