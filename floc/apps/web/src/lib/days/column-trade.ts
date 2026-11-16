export type Trade = { from: number; to: number; indices: number[] };

const around = (day: number) => [day - 1, day, day + 1];

export function tradeFor(from: number, to: number): Trade | null {
  if (from === to) return null;
  const indices = [...new Set([...around(from), ...around(to)])].sort((a, b) => a - b);
  return { from, to, indices };
}

function tracksAround(indices: number[], focus: number, focusPx: number) {
  return indices
    .map((i) => (i === focus ? `${focusPx}px` : Math.abs(i - focus) === 1 ? "var(--days-side)" : "0px"))
    .join(" ");
}

export function tradeTracks(trade: Trade, focusPx: number) {
  return {
    before: tracksAround(trade.indices, trade.from, focusPx),
    after: tracksAround(trade.indices, trade.to, focusPx),
  };
}

export function slotIndices(focusIndex: number, trade: Trade | null): number[] {
  return trade ? [...trade.indices] : [focusIndex - 1, focusIndex, focusIndex + 1];
}
