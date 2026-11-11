// Shared by the four heroes: glyphs, the Sicily group, one clock per scene, the hero's words.
import { icon as base, group, face } from "/_house/switcher.js";

export { group, face };
export const ico = (name, cls = "ico") => `<svg class="${cls}" viewBox="0 0 14 14" aria-hidden="true">${base[name]}</svg>`;
export const faces = (size = 26, max = 6) => `<span class="avatar-row">${group.slice(0, max).map((p) => face(p, size)).join("")}</span>`;

// ?still shows every scene at rest, for screenshots.
export const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches || new URLSearchParams(location.search).has("still");

/** One clock for a scene: timers and frames that stop together. */
export function scene() {
  let timers = [];
  let frame = 0;
  return {
    at(ms, fn) { if (reduced) fn(); else timers.push(setTimeout(fn, ms)); },
    /** Calls `fn(seconds)` every frame until it returns false. */
    loop(fn) {
      const t0 = performance.now();
      const tick = (now) => { if (fn((now - t0) / 1000) !== false) frame = requestAnimationFrame(tick); };
      frame = requestAnimationFrame(tick);
    },
    clear() { timers.forEach(clearTimeout); timers = []; cancelAnimationFrame(frame); },
  };
}

export const head = (h1, extra = "") => `<section class="c-hero">
  <h1>${h1}</h1>
  <p class="lede">Keep the destination, dates, route and costs in one place. Plan on your own, or with everyone who&rsquo;s coming.</p>
  ${extra}
  <div class="cta">
    <a class="pill-btn big" href="#">Start a trip — free</a>
    <a class="pill-btn ghost big" href="#">See example trips</a>
  </div>
</section>`;

export const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
