// Round 3: the paper globe from the earlier hero rounds (landing-hero-flock), in the house globe's tokens.
import { painter, loadWorld } from "../landing-hero-flock/globes.js";
import { arc, token } from "../landing-hero-flock/round3.js";
import { reduce } from "./common.js";

export { painter, loadWorld, arc, token };

// The aeroplane the live hero flies (landing/hero/flight.tsx), nose to the right. Never a paper plane.
const PLANE = typeof Path2D === "undefined" ? null : new Path2D("M23 12c0-1-1-1.4-2-1.4h-6L9.5 3h-2l3 7.6H5L3.2 8H1.6l1 4-1 4h1.6L5 13.4h5.5l-3 7.6h2l5.5-7.6h6c1 0 2-.4 2-1.4Z");

export const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

/** A dashed route along `path`, drawn to `shown` (0–1), with the plane at its front fading as it lands. */
export function flight(g, path, shown, { plane = true, alpha = 1 } = {}) {
  if (shown <= 0) return;
  const c = g.ctx;
  c.save();
  c.globalAlpha = alpha;
  c.setLineDash([5, 6]); c.lineWidth = 1.8; c.strokeStyle = token("--pen"); c.lineCap = "round"; c.beginPath();
  let down = false;
  path.slice(0, Math.max(2, Math.ceil(path.length * shown))).forEach((p) => {
    const [x, y, z] = g.project(p);
    if (z < 0) { down = false; return; }
    if (down) c.lineTo(x, y); else c.moveTo(x, y);
    down = true;
  });
  c.stroke(); c.setLineDash([]);
  const landing = clamp((shown - 0.86) / 0.14);
  if (plane && PLANE && landing < 1) {
    const i = Math.max(1, Math.round((path.length - 1) * shown));
    const [a, b] = [g.project(path[i - 1]), g.project(path[i])];
    const k = 0.8 * (1 - 0.5 * landing);
    c.globalAlpha = alpha * (1 - landing);
    c.translate(b[0], b[1]);
    c.rotate(Math.atan2(b[1] - a[1], b[0] - a[0]));
    c.scale(k, k); c.translate(-12, -12);
    c.lineJoin = "round"; c.lineWidth = 3; c.strokeStyle = token("--sheet"); c.stroke(PLANE);
    c.fillStyle = token("--pen"); c.fill(PLANE);
  }
  c.restore();
}

/** Every frame until `fn(now)` returns false. Reduced motion jumps far ahead, so every span is done. */
export function frames(fn) {
  let id = 0;
  const tick = (now) => { if (fn(reduce ? now + 1e7 : now) !== false) id = requestAnimationFrame(tick); };
  id = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(id);
}

/** 0–1 progress of a span that starts at `from` ms and lasts `ms`, eased. */
export const span = (t, from, ms) => ease(clamp((t - from) / ms));
