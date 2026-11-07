/**
 * Why: the second beat of opening a trip, pure so its timing is tested: the page pours out of the joined top bar,
 * lands on the trip's card with the beads' give and squash (fuse-bar.css), and only then fades in, so two outlines
 * never show. One frame of shapes for a moment `t` (0–1), drawn by the goo layer.
 */
export type Box = { x: number; y: number; w: number; h: number };
export type CurtainFrame = {
  /** The neck from the bar's lower edge to the sheet, until it lets go. */
  neck: Box | null;
  card: Box;
  squash: { sx: number; sy: number };
  /** How far the trip page itself has come in, 0–1. */
  page: number;
};

export const POUR_MS = 980;

const LANDED = 0.82;
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const inOut = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2);
const pulse = (u: number) => Math.sin(Math.PI * clamp(u));

export function curtainAt(t: number, { bar, card }: { bar: Box; card: Box }): CurtainFrame {
  const fall = inOut(seg(t, 0, 0.34));
  const wide = inOut(seg(t, 0, 0.52));
  const tall = inOut(seg(t, 0.02, 0.58));
  const w = mix(bar.w - 40, card.w, wide);
  const sheet = {
    x: mix(bar.x + bar.w / 2, card.x + card.w / 2, wide) - w / 2,
    y: mix(bar.y + bar.h - 12, card.y, fall),
    w,
    h: mix(28, card.h, tall),
  };
  const give = pulse(seg(t, 0.3, 0.44));
  const land = pulse(seg(t, 0.58, LANDED));
  const squash = t >= LANDED ? { sx: 1, sy: 1 } : { sx: 1 - 0.005 * give + 0.018 * land, sy: 1 + 0.008 * give - 0.035 * land };
  const neckW = (bar.w - 60) * (1 - inOut(seg(t, 0.2, 0.42)));
  const neckTop = bar.y + bar.h - 14;
  const neck = neckW > 1 ? { x: bar.x + bar.w / 2 - neckW / 2, y: neckTop, w: neckW, h: Math.max(0, sheet.y - neckTop + 16) } : null;
  return {
    neck,
    card: t >= 0.58 ? card : sheet,
    squash,
    page: t >= 1 ? 1 : inOut(seg(t, LANDED, 1)),
  };
}
