import { deepFrame, flagSide, frameAt, nudges, pinsOf, roomIn, tweenAt, zoomFor, type StopPin } from "@/lib/landing/globe/deep";
import { greatCircle, type LatLng } from "@/lib/landing/globe/sphere";

import type { globePainter } from "./paint-globe";

type Painter = NonNullable<ReturnType<typeof globePainter>>;
type Tween = { from: number; to: number; t0: number; ms: number };

/** `stage` carries `--deep` for the layout; each child of `pins` is one place of the trip, in `pinsOf` order. */
export type WayDom = { stage: HTMLElement; pins: HTMLElement };

const NARROW = "(max-width: 900px)";
const [OPEN_MS, SHUT_MS, HOP_MS] = [1300, 1100, 900];
const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

/**
 * The way in to one trip: the globe's box opens to the page's width, the sphere zooms in, the stops show as pins.
 * Why: the layout and the canvas both read `--deep`, so box and sphere move on one clock; two timers would drift.
 */
export function wayIn(paint: Painter, onChange: (state: "open" | "shut") => void) {
  let [deep, half, step, drawn] = [0, 0, 0, 0];
  let zoom: Tween | null = null;
  let trail: Tween | null = null;
  let cam = { R: 0, fx: 0.5 };
  let stops: LatLng[] = [];
  let pins: StopPin[] = [];
  let offs: { x: number; y: number }[] = [];
  let hops: LatLng[][] = [];
  let dom: WayDom | null = null;
  let flagDue = false;

  const spot = (view: LatLng, k: number) => {
    const q = paint.place(view, pins[k]!);
    return { x: q.x + offs[k]!.x, y: q.y + offs[k]!.y, z: q.z };
  };

  /** Puts the name of the stop the map is on, on the side of its pin that is clear. */
  function flag(to: WayDom) {
    const view = stops[step]!;
    const at = pins.findIndex((p) => p.stops.includes(step));
    const el = to.pins.children[at] as HTMLElement | undefined;
    const name = el?.querySelector("i");
    if (!el || !name) return;
    const pts = pins.map((_, k) => spot(view, k));
    el.dataset.side = flagSide(at, pts, { w: name.offsetWidth, h: name.offsetHeight }, paint.box());
  }

  function route(view: LatLng, alpha: number) {
    hops.forEach((path, k) => {
      const last = path.length - 1;
      paint.line(view, path, last, 2, "edge", alpha);
      const part = clamp(drawn - k);
      if (!part) return;
      const upTo = Math.max(1, Math.round(last * part));
      paint.line(view, path, upTo, 5.5, "sheet", alpha);
      paint.line(view, path, upTo, 2.4, "pen", alpha);
      if (part < 1) paint.pin(view, path[upTo]!, 3.5, true);
    });
  }

  return {
    isOpen: () => dom !== null,
    moving: () => zoom !== null || trail !== null,
    deep: () => deep,
    frame: (box: { w: number; h: number }) => (dom ? frameAt(deep, box, half, cam) : undefined),
    open(next: LatLng[], to: WayDom, still: boolean) {
      const wide = !matchMedia(NARROW).matches;
      const f = deepFrame(wide);
      const box = paint.box();
      [dom, stops, pins, step, drawn, trail] = [to, next, pinsOf(next), 0, 0, null];
      half = Math.min(box.w, box.h) / 2;
      to.stage.style.setProperty("--deep-h", `${f.h}px`);
      cam = { R: zoomFor(stops, roomIn({ w: to.stage.clientWidth, h: f.h }, wide), f.max), fx: f.fx };
      offs = nudges(pins, cam.R);
      hops = stops.slice(1).map((p, k) => greatCircle(stops[k]!, p, 20));
      zoom = { from: 0, to: 1, t0: performance.now(), ms: still ? 0 : OPEN_MS };
    },
    /** False when there is nothing to close, or it is still on its way in or out. */
    close(still: boolean) {
      if (!dom || zoom) return false;
      zoom = { from: 1, to: 0, t0: performance.now(), ms: still ? 0 : SHUT_MS };
      return true;
    },
    /** Moves to a stop and draws the route as far as it. Hands back where the globe must turn to. */
    goTo(k: number, still: boolean) {
      step = clamp(k, 0, stops.length - 1);
      trail = { from: drawn, to: step, t0: performance.now(), ms: still ? 0 : HOP_MS };
      flagDue = true;
      return stops[step]!;
    },
    advance(now: number) {
      if (zoom && dom) {
        const t = tweenAt(zoom, now);
        deep = t.v;
        dom.stage.style.setProperty("--deep", deep.toFixed(4));
        if (t.done) {
          const opened = zoom.to === 1;
          zoom = null;
          if (opened) flagDue = true;
          else dom = null;
          onChange(opened ? "open" : "shut");
        }
      }
      if (!trail) return;
      const t = tweenAt(trail, now);
      drawn = t.v;
      if (t.done) trail = null;
    },
    draw(view: LatLng) {
      if (!dom) return;
      route(view, clamp((deep - 0.6) * 3.4));
      pins.forEach((_, k) => {
        const el = dom!.pins.children[k] as HTMLElement | undefined;
        if (!el) return;
        const q = spot(view, k);
        el.style.transform = `translate(${q.x.toFixed(1)}px, ${q.y.toFixed(1)}px)`;
        el.hidden = q.z < 0.05;
      });
      if (!flagDue) return;
      flagDue = false;
      flag(dom);
    },
  };
}
