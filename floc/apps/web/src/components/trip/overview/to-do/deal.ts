export const DEAL_MS = { open: 560, close: 420 };

type Card = { top: number; height: number; width: number };
export type DealStart = { bottom: number; dy: number; sx: number };

const clamp = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

function bezier(x1: number, y1: number, x2: number, y2: number) {
  const at = (t: number, a: number, b: number) => 3 * (1 - t) ** 2 * t * a + 3 * (1 - t) * t * t * b + t ** 3;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let [lo, hi] = [0, 1];
    for (let i = 0; i < 26; i++) {
      const t = (lo + hi) / 2;
      if (at(t, x1, x2) < x) lo = t;
      else hi = t;
    }
    return at((lo + hi) / 2, y1, y2);
  };
}

export const dealEase = bezier(0.3, 0.1, 0.12, 1);

function inverse(y: number) {
  let [lo, hi] = [0, 1];
  for (let i = 0; i < 26; i++) {
    const m = (lo + hi) / 2;
    if (dealEase(m) < y) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
}

export const resumeAt = (opening: boolean, pos: number) => inverse(opening ? pos : 1 - pos);

export function dealStarts(cards: Card[]): DealStart[] {
  return cards.map(({ top, height, width }, i) => {
    const near = i === 0;
    const bottom = top + height;
    return { bottom, dy: (near ? 5 : 10) - bottom, sx: (width - 2 * (near ? 10 : 22)) / width };
  });
}

export function dealFrame(pos: number, starts: DealStart[]) {
  const n = starts.length;
  const beat = Math.min(0.06, 0.45 / Math.max(1, n - 1));
  let lowest = 0;
  const cards = starts.map((s, i) => {
    const e = smooth(0, 1, (pos - i * beat) / (1 - (n - 1) * beat));
    const y = e >= 1 ? 0 : s.dy * (1 - e);
    lowest = Math.max(lowest, s.bottom + y);
    return { y, sx: s.sx + (1 - s.sx) * e, ink: smooth(0.2, 0.7, e) };
  });
  return { cards, height: Math.max(0, lowest - 10 * (1 - pos)) };
}
