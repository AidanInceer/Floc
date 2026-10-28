import { middleOf, type Countries } from "../countries";
import { domeAt, zoomRange } from "../dome";
import { countryAt } from "../pick";
import { aimAt, placeAt, spotOf, type Point } from "../screen";
import type { LatLng } from "../sphere";

import { gestures } from "./gestures";
import { paintTravelGlobe, type MapState } from "./paint";

type Host = {
  states: () => Record<string, MapState>;
  /** A tap on a country, or null on the sea or off the globe. */
  onTap: (code: string | null) => void;
  /** After every paint, so what sits over the globe can follow it. */
  onDraw: () => void;
  onZoom: (zoom: { atMin: boolean; atMax: boolean }) => void;
};

const RAD = Math.PI / 180;
const EMPTY: Countries = { shapes: [], dots: [] };
// Why 10: a finger's width in px, turned into degrees on the sphere as drawn, so an island dot can be tapped at any zoom.
const FINGER = 10;
const GLIDE_MS = 420;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** The travel globe on a canvas: a dome that turns under a drag, zooms, and says which country a tap hit. */
export function travelGlobe(canvas: HTMLCanvasElement, host: Host) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  let land = EMPTY;
  let view: LatLng = { lat: 7, lng: 4 };
  let opening: LatLng | null = null;
  let k = 1;
  let selected: string | null = null;
  // Why later: a web view can be 0 by 0 when the outline arrives, and aiming in an empty box puts the place off screen.
  let aimed = false;
  let [queued, glide] = [0, 0];
  let grabbed: LatLng | null = null;
  let pinched: { k: number; place: LatLng | null } | null = null;

  const box = () => ({ w: canvas.clientWidth, h: canvas.clientHeight });
  const fit = () => domeAt(box(), k);
  const middle = (): Point => ({ x: box().w / 2, y: box().h / 2 });
  // Why the clamp: a drag that starts in the box's empty corner still takes hold of the globe at its nearest edge.
  const onDisc = (p: Point) => {
    const { R, cx, cy } = fit();
    const d = Math.hypot(p.x - cx, p.y - cy);
    return d < R ? p : { x: cx + ((p.x - cx) / d) * R * 0.999, y: cy + ((p.y - cy) / d) * R * 0.999 };
  };

  function paint() {
    const { w, h } = box();
    if (!w || !h) return;
    if (!aimed && opening) [view, aimed] = [aimAt(view, fit(), opening, middle()), true];
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== Math.round(w * dpr)) canvas.width = Math.round(w * dpr);
    if (canvas.height !== Math.round(h * dpr)) canvas.height = Math.round(h * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    paintTravelGlobe(ctx!, { box: { w, h }, fit: fit(), view, land, states: host.states(), selected });
    host.onDraw();
    tellZoom();
  }
  // Told on each paint, not each zoom: the range moves when the box is first laid out or resized.
  let told = "";
  function tellZoom() {
    const { min, max } = zoomRange(box());
    const zoom = { atMin: k <= min * 1.001, atMax: k >= max * 0.999 };
    if (JSON.stringify(zoom) === told) return;
    told = JSON.stringify(zoom);
    host.onZoom(zoom);
  }
  const draw = () => {
    if (!queued) queued = requestAnimationFrame(() => ((queued = 0), paint()));
  };

  function zoomTo(next: number, p: Point, place: LatLng | null) {
    const { min, max } = zoomRange(box());
    k = Math.min(max, Math.max(min, next));
    if (place) view = aimAt(view, fit(), place, p);
    draw();
  }

  function glideTo(next: number, p: Point) {
    cancelAnimationFrame(glide);
    const place = placeAt(view, fit(), p);
    const [k0, t0] = [k, performance.now()];
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const step = (now: number) => {
      const t = still ? 1 : Math.min(1, (now - t0) / GLIDE_MS);
      zoomTo(k0 * (next / k0) ** easeInOut(t), p, place);
      if (t < 1) glide = requestAnimationFrame(step);
    };
    glide = requestAnimationFrame(step);
  }

  const pin = (code: string): Point | null => {
    const place = middleOf(land, code);
    const spot = place && spotOf(view, fit(), place);
    const { w, h } = box();
    return spot?.front && spot.x >= 0 && spot.y >= 0 && spot.x <= w && spot.y <= h ? spot : null;
  };

  const stopGestures = gestures(canvas, {
    grab() {
      cancelAnimationFrame(glide);
      [grabbed, pinched] = [null, null];
    },
    drag(from, p) {
      grabbed ??= placeAt(view, fit(), onDisc(from));
      if (!grabbed) return;
      view = aimAt(view, fit(), grabbed, p);
      draw();
    },
    pinch(scale, mid, start) {
      pinched ??= { k, place: placeAt(view, fit(), start) };
      zoomTo(pinched.k * scale, mid, pinched.place);
    },
    tap(p) {
      const f = fit();
      const at = placeAt(view, f, p);
      host.onTap(at ? countryAt(land, at, FINGER / (f.R * RAD)) : null);
    },
    wheel: (factor, p) => zoomTo(k * factor, p, placeAt(view, fit(), p)),
  });

  return {
    /** The outlines, and the place to open on: it lands in the middle of the box. */
    setLand(next: Countries, from: LatLng) {
      [land, opening, aimed] = [next, from, false];
      zoomTo(k, middle(), null);
    },
    select(code: string | null) {
      selected = code;
      draw();
    },
    /** Where a country's middle is on the canvas; null when it is round the back or out of the box. */
    pin,
    /** Turns a country into view, unless it shows already. */
    bring(code: string) {
      const place = middleOf(land, code);
      if (place && !pin(code)) view = aimAt(view, fit(), place, middle());
      draw();
    },
    /** The buttons zoom on the picked country, else on where the globe opened, else the middle. */
    zoomBy(factor: number) {
      const spot = (selected && pin(selected)) || (opening && spotOf(view, fit(), opening));
      const p = spot && "front" in spot && !spot.front ? middle() : (spot ?? middle());
      const { min, max } = zoomRange(box());
      glideTo(Math.min(max, Math.max(min, k * factor)), p);
    },
    redraw: draw,
    stop() {
      stopGestures();
      cancelAnimationFrame(queued);
      cancelAnimationFrame(glide);
    },
  };
}

export type TravelGlobeEngine = NonNullable<ReturnType<typeof travelGlobe>>;
