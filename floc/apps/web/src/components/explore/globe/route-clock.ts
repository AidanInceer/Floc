import { easeInOut } from "@/lib/landing/globe/flight";

type Run = { from: number; to: number; t0: number; ms: number };

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const at = ({ t0, ms }: Run, now: number) => (ms ? clamp((now - t0) / ms) : 1);

/**
 * The one clock of Explore's globe: `deep` runs 0 (every trip) to 1 (one trip); `drawn` is how much of the route line shows.
 * Why: the sphere, its turn, the pins and the line all read it, so they move as one and cannot drift apart.
 */
export function routeClock() {
  let [deep, drawn, progress] = [0, 0, 1];
  let zoom: Run | null = null;
  let line: Run | null = null;
  let after: (() => void) | null = null;

  return {
    deep: () => deep,
    drawn: () => drawn,
    /** How far through its move the zoom is, 0 to 1, eased: the turn of the globe follows it. */
    progress: () => progress,
    zooming: () => zoom !== null,
    moving: () => zoom !== null || line !== null,
    /** Heads for `to` from where it is; `then` runs on arrival. The line is rubbed out. */
    go(to: number, ms: number, then: (() => void) | null = null) {
      zoom = { from: deep, to, t0: performance.now(), ms };
      [after, line, drawn, progress] = [then, null, 0, 0];
    },
    /** Draws the route line from its start to its end. */
    draw(ms: number) {
      line = { from: 0, to: 1, t0: performance.now(), ms };
    },
    advance(now: number) {
      if (zoom) {
        const u = at(zoom, now);
        progress = easeInOut(u);
        deep = zoom.from + (zoom.to - zoom.from) * progress;
        if (u >= 1) {
          const then = after;
          [zoom, after] = [null, null];
          then?.();
        }
      }
      if (!line) return;
      const u = at(line, now);
      drawn = easeInOut(u);
      if (u >= 1) line = null;
    },
  };
}
