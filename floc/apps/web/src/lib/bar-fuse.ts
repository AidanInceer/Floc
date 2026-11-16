export const SCROLL_RANGE = 140;

const FOLD_END = 0.55;
const JOIN_AT = 0.55;
const SPLIT_AT = 0.45;

const clamp = (x: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x));
const seg = (p: number, from: number, to: number) => clamp((p - from) / (to - from));
const easeOut = (t: number) => 1 - (1 - t) ** 3;
const easeIn = (t: number) => t * t;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export type Pull = { gap: number; neck: number };

export const scrollProgress = (scrollY: number) => clamp(scrollY / SCROLL_RANGE);

export const foldAmount = (p: number) => easeOut(seg(p, 0, FOLD_END));

export const restGap = (p: number, gap: number) => gap - (gap / 3) * easeIn(seg(p, 0, FOLD_END));

export const BAR_HOLD_EVENT = "floc:bar-hold";

export function nextJoined(joined: boolean, p: number): boolean {
  if (joined) return p >= SPLIT_AT;
  return p >= JOIN_AT;
}

export function wantJoined(joined: boolean, p: number, held: boolean): boolean {
  return held || nextJoined(joined, p);
}

export function joinStep(k: number, from: Pull): Pull {
  return {
    gap: from.gap * (1 - easeInOut(k)),
    neck: lerp(from.neck, 1, easeOut(Math.min(1, k * 1.5))),
  };
}

export function splitStep(k: number, from: Pull, rest: number): Pull {
  return {
    gap: lerp(from.gap, rest, easeOut(k)),
    neck: from.neck * (1 - easeIn(k)),
  };
}

const bead = (x: number, w: number, h: number, r: number) =>
  `M${x + r} 0H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${r}V${h - r}A${r} ${r} 0 0 1 ${x + w - r} ${h}H${x + r}A${r} ${r} 0 0 1 ${x} ${h - r}V${r}A${r} ${r} 0 0 1 ${x + r} 0Z`;

export function skinPath(boxes: { x: number; w: number }[], height: number, radius: number, necks: number[]): string {
  let d = boxes.map(({ x, w }) => bead(x, w, height, radius)).join("");
  necks.forEach((s, i) => {
    const left = boxes[i];
    const right = boxes[i + 1];
    if (s <= 0.001 || !left || !right) return;
    const x1 = left.x + left.w;
    const x2 = right.x;
    const half = (s * height) / 2;
    const reach = 4 + 8 * s;
    const mid = (x1 + x2) / 2;
    d += `M${x1 - reach} 0Q${mid} ${height - 2 * half} ${x2 + reach} 0L${x2 + reach} ${height}Q${mid} ${2 * half} ${x1 - reach} ${height}Z`;
  });
  return d;
}
