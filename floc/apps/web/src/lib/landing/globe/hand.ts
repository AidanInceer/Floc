import { apart, type LatLng } from "./sphere";

/** A whole number from 0 to `n - 1`. The caller brings the source, so a test can fix it. */
type Pick = (n: number) => number;

/** How many tiles the Borrow band shows; every other listing waits behind them. */
export const HAND = 6;

const FIRST_STOP = 1000;
const STOP_GAP = 340;

/** The `n` places nearest a point, nearest first, as indexes. */
export function around(point: LatLng, places: LatLng[], n = HAND): number[] {
  return places
    .map((p, i) => ({ i, far: apart(point, p) }))
    .sort((a, b) => a.far - b.far)
    .slice(0, n)
    .map((p) => p.i);
}

export function shuffled<T>(list: readonly T[], pick: Pick): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = pick(i + 1);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** The next six: a trip that stays keeps its tile, so only the tiles that change move; the new trips take the free tiles in a shuffled order. */
export function arrange(hand: number[], want: number[], pick: Pick): number[] {
  const fresh = shuffled(want.filter((i) => !hand.includes(i)), pick);
  return hand.map((i) => (want.includes(i) ? i : (fresh.shift() ?? i)));
}

/** Where a spin lands: a trip that is not on show, or another tile when every trip is. */
export function spinPick(count: number, hand: number[], at: number, pick: Pick): number {
  const all = Array.from({ length: count }, (_, i) => i);
  const hidden = all.filter((i) => !hand.includes(i));
  const pool = hidden.length ? hidden : all.filter((i) => i !== at);
  return pool.length ? pool[pick(pool.length)]! : at;
}

/** When each tile stops, in ms from the spin: one by one, the pick last. A tile that keeps its trip never rolls. */
export function stopTimes(hand: number[], next: number[], win: number, pick: Pick): (number | null)[] {
  const moving = next.map((_, slot) => slot).filter((slot) => hand[slot] !== next[slot]);
  const winSlot = next.indexOf(win);
  const order = [...shuffled(moving.filter((slot) => slot !== winSlot), pick), ...moving.filter((slot) => slot === winSlot)];
  return next.map((_, slot) => (order.includes(slot) ? FIRST_STOP + STOP_GAP * order.indexOf(slot) : null));
}
