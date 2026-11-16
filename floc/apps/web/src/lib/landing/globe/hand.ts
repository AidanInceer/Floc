import { apart, type LatLng } from "@floc/globe/sphere";

type Pick = (n: number) => number;

export const HAND = 6;

const FIRST_STOP = 1000;
const STOP_GAP = 340;

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

export function arrange(hand: number[], want: number[], pick: Pick): number[] {
  const fresh = shuffled(want.filter((i) => !hand.includes(i)), pick);
  return hand.map((i) => (want.includes(i) ? i : (fresh.shift() ?? i)));
}

export function spinPick(count: number, hand: number[], at: number, pick: Pick): number {
  const all = Array.from({ length: count }, (_, i) => i);
  const hidden = all.filter((i) => !hand.includes(i));
  const pool = hidden.length ? hidden : all.filter((i) => i !== at);
  return pool.length ? pool[pick(pool.length)]! : at;
}

export function stopTimes(hand: number[], next: number[], win: number, pick: Pick): (number | null)[] {
  const moving = next.map((_, slot) => slot).filter((slot) => hand[slot] !== next[slot]);
  const winSlot = next.indexOf(win);
  const order = [...shuffled(moving.filter((slot) => slot !== winSlot), pick), ...moving.filter((slot) => slot === winSlot)];
  return next.map((_, slot) => (order.includes(slot) ? FIRST_STOP + STOP_GAP * order.indexOf(slot) : null));
}
