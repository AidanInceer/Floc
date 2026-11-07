// The top bar's three beads fuse into one as the page scrolls. Maths only — the
// browser side lives in components/chrome/fuse-bar.tsx.

/** Pixels of scroll over which the bar changes from three beads to one. */
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

/** 0 open, 1 folded: how far the words have tucked away. */
export const foldAmount = (p: number) => easeOut(seg(p, 0, FOLD_END));

/** The gap between beads before they join: they drift a third closer on the way. */
export const restGap = (p: number, gap: number) => gap - (gap / 3) * easeIn(seg(p, 0, FOLD_END));

/** Sent with `detail: true` to hold the beads joined (a trip opening from My trips), `false` to let them follow the scroll again. */
export const BAR_HOLD_EVENT = "floc:bar-hold";

/** Joined from 0.55, apart again below 0.45 — the gap between stops a hovering scroll flickering. */
export function nextJoined(joined: boolean, p: number): boolean {
  if (joined) return p >= SPLIT_AT;
  return p >= JOIN_AT;
}

/** Joined while held, else as the scroll says. */
export function wantJoined(joined: boolean, p: number, held: boolean): boolean {
  return held || nextJoined(joined, p);
}

/** The pull together, over k 0 to 1: an even ease, the neck reaching across a little ahead of it. */
export function joinStep(k: number, from: Pull): Pull {
  return {
    gap: from.gap * (1 - easeInOut(k)),
    neck: lerp(from.neck, 1, easeOut(Math.min(1, k * 1.5))),
  };
}

/** The pull apart: the neck thins and breaks while the gap opens to its resting width. */
export function splitStep(k: number, from: Pull, rest: number): Pull {
  return {
    gap: lerp(from.gap, rest, easeOut(k)),
    neck: from.neck * (1 - easeIn(k)),
  };
}

const bead = (x: number, w: number, h: number, r: number) =>
  `M${x + r} 0H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${r}V${h - r}A${r} ${r} 0 0 1 ${x + w - r} ${h}H${x + r}A${r} ${r} 0 0 1 ${x} ${h - r}V${r}A${r} ${r} 0 0 1 ${x + r} 0Z`;

/**
 * One SVG path for the whole bar: a rounded rectangle for each bead, and between
 * two beads a neck that pinches in at the middle — two drops of water meeting.
 * `necks[i]` is 0 to 1 for the join between bead i and bead i + 1.
 */
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
