import { deepFrame, frameAt, roomIn, tweenAt, zoomFor } from "@/lib/landing/globe/deep";
import type { LatLng } from "@floc/globe/sphere";

import type { globePainter } from "@/components/globe/paint-globe";

type Painter = NonNullable<ReturnType<typeof globePainter>>;
type Tween = { from: number; to: number; t0: number; ms: number };

/** `stage` carries `--deep` for the layout. */
export type WayDom = { stage: HTMLElement };

const NARROW = "(max-width: 900px)";
const [OPEN_MS, SHUT_MS] = [1300, 1100];

/**
 * The way in to one trip: the globe's box opens to the page's width and the sphere zooms in.
 * Why: the layout and the canvas both read `--deep`, so box and sphere move on one clock; two timers would drift.
 */
export function wayIn(paint: Painter, onChange: (state: "open" | "shut") => void) {
  let [deep, half] = [0, 0];
  let zoom: Tween | null = null;
  let cam: { R: number; fx: number; fy?: number } = { R: 0, fx: 0.5 };
  let dom: WayDom | null = null;

  return {
    isOpen: () => dom !== null,
    moving: () => zoom !== null,
    deep: () => deep,
    frame: (box: { w: number; h: number }) => (dom ? frameAt(deep, box, half, cam) : undefined),
    open(stops: LatLng[], to: WayDom, still: boolean) {
      const wide = !matchMedia(NARROW).matches;
      const f = deepFrame(wide);
      const box = paint.box();
      dom = to;
      half = Math.min(box.w, box.h) / 2;
      to.stage.style.setProperty("--deep-h", `${f.h}px`);
      cam = { R: zoomFor(stops, roomIn({ w: to.stage.clientWidth, h: f.h }, wide), f.max), fx: f.fx };
      zoom = { from: 0, to: 1, t0: performance.now(), ms: still ? 0 : OPEN_MS };
    },
    /** Takes the view the open trip left the map at, so the way out starts where it is. */
    settle(fit: { R: number; cx: number; cy: number }) {
      const box = paint.box();
      cam = { R: fit.R, fx: fit.cx / box.w, fy: fit.cy / box.h };
    },
    /** False when there is nothing to close, or it is still on its way in or out. */
    close(still: boolean) {
      if (!dom || zoom) return false;
      zoom = { from: 1, to: 0, t0: performance.now(), ms: still ? 0 : SHUT_MS };
      return true;
    },
    advance(now: number) {
      if (!zoom || !dom) return;
      const t = tweenAt(zoom, now);
      deep = t.v;
      dom.stage.style.setProperty("--deep", deep.toFixed(4));
      if (!t.done) return;
      const opened = zoom.to === 1;
      zoom = null;
      if (!opened) dom = null;
      onChange(opened ? "open" : "shut");
    },
  };
}
