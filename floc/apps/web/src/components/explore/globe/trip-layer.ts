import type { Box } from "@/components/explore/atlas/tag-place";
import { paintRoute, type RouteFrame } from "@/components/explore/route/paint-route";
import { readInk } from "@/components/explore/route/route-ink";
import { nameRoute, tagWidth, type Name } from "@/components/explore/route/route-names";
import type { globePainter, Tint } from "@/components/globe/paint-globe";
import { followPen, glideTo, markFade, penLook, type Timeline } from "@/lib/explore/route/follow-pen";
import { frameRoute } from "@/lib/explore/route/fit-route";
import { sphere, type Pose } from "@/lib/explore/route/glide";
import { penPoints, routeShape, type Shape } from "@/lib/explore/route/route-shape";
import type { TripRoute } from "@/lib/explore/route/trip-route";
import { unproject, type LatLng } from "@floc/globe/sphere";

import type { Fit } from "./dome";

type Painter = NonNullable<ReturnType<typeof globePainter>>;
export type TripTint = { rings: ReadonlySet<number[][]>; tone: string };
type Built = { shape: Shape; pieces: LatLng[][]; stops: LatLng[]; names: Name[]; look: (g: number) => LatLng; length: number; pose: Pose<LatLng>; tint: TripTint };
type Run = { tl: Timeline<LatLng>; t0: number; closing: boolean; fromDome: boolean; full?: boolean };
type Options = { foot?: number; edge?: number; slow?: number };
const PINS_GONE_MS = 450;
const clamp = (v: number) => Math.min(1, Math.max(0, v));

export const poseOf = (fit: Fit, view: LatLng, width: number): Pose<LatLng> => ({ centre: view, w: width / fit.R, at: { x: fit.cx, y: fit.cy } });
export const fitOf = (pose: Pose<LatLng>, width: number): Fit => ({ R: width / pose.w, cx: pose.at.x, cy: pose.at.y });

export function tripLayer(canvas: HTMLCanvasElement, paint: Painter, { foot = 36, edge = 0, slow = 1 }: Options = {}) {
  const ctx = canvas.getContext("2d")!;
  let ink = readInk(canvas);
  let width = tagWidth(ctx, ink);
  let [trip, old, run, t] = [null as Built | null, null as Built | null, null as Run | null, 0];
  let open: { route: TripRoute; tint: TripTint } | null = null;
  let held: Pose<LatLng> | null = null;

  function build(route: TripRoute, tint: TripTint, clear: Box): Built {
    const fit = frameRoute(route, clear, foot, edge);
    const { view, R, at } = fit;
    const back = (p: { x: number; y: number }) => unproject(view, (p.x - fit.cx) / R, (fit.cy - p.y) / R);
    const shape = routeShape(route, at, { samples: 40, out: 44, least: 60 });
    return {
      shape,
      pieces: shape.pieces.map((p) => p.px.map(back)),
      stops: route.stops,
      names: nameRoute(ctx, shape, ink, { left: clear.left + edge / 3, top: clear.top, right: clear.right - edge / 3, bottom: clear.bottom }),
      look: penLook(sphere, penPoints(shape, 240).map(back)),
      length: shape.pieces.reduce((sum, p) => sum + p.len, 0),
      pose: poseOf(fit, view, clear.right - clear.left),
      tint,
    };
  }

  function frameOf(b: Built, view: LatLng, drawn: number, seen: (at: number) => number): RouteFrame {
    const place = (p: LatLng) => paint.place(view, p);
    return { pieces: b.pieces.map((ps) => ps.map(place)), stops: b.stops.map(place), drawn, seen, alpha: 1 };
  }

  return {
    isOpen: () => trip !== null,
    running: () => run !== null,
    open(route: TripRoute, tint: TripTint, from: Pose<LatLng>, clear: Box) {
      [old, held] = [trip, null];
      open = { route, tint };
      trip = build(route, tint, clear);
      run = { tl: followPen(sphere, { from, to: trip.pose, look: trip.look, length: trip.length, slow }), t0: performance.now(), closing: false, fromDome: old === null };
    },
    close(from: Pose<LatLng>, to: Pose<LatLng>) {
      if (!trip) return;
      [old, trip, open, held] = [trip, null, null, null];
      run = { tl: glideTo(sphere, from, to), t0: performance.now(), closing: true, fromDome: false };
    },
    focus(k: number, from: Pose<LatLng>) {
      const stop = trip?.stops[k];
      if (!trip || !stop) return;
      old = null;
      const to = { centre: stop, w: trip.pose.w / 1.6, at: trip.pose.at };
      held = to;
      run = { tl: glideTo(sphere, from, to), t0: performance.now(), closing: false, fromDome: false, full: true };
    },
    reset() {
      [trip, old, run, open, held] = [null, null, null, null, null];
    },
    skip() {
      if (run && !run.closing) run.t0 = performance.now() - run.tl.skip;
    },
    advance(now: number, still: boolean): { pose: Pose<LatLng> | null; world: number } {
      if (!run) return { pose: null, world: trip ? 0 : 1 };
      t = still ? run.tl.ms : Math.min(run.tl.ms, now - run.t0);
      const { tl, closing, fromDome } = run;
      const world = closing ? clamp((t / tl.ms - 0.6) / 0.4) : fromDome ? 1 - clamp(t / PINS_GONE_MS) : 0;
      const pose = tl.pose(t);
      if (t >= tl.ms) [run, old] = [null, null];
      return { pose, world };
    },
    rest: (W: number): Fit | null => (trip ? fitOf(held ?? trip.pose, W) : null),
    tint(): Tint | undefined {
      if (trip) return { ...trip.tint, alpha: run ? clamp(t / 600) : 1 };
      if (old && run) return { ...old.tint, alpha: 1 - clamp(t / (run.tl.ms * 0.5)) };
      return undefined;
    },
    draw(view: LatLng) {
      if (old && run) {
        const left = run.tl.old(t);
        if (left > 0) paintRoute(ctx, old.shape, frameOf(old, view, left, (at) => (left >= at ? 1 : 0)), ink, old.names, width);
      }
      if (!trip) return;
      const live = run && !run.full ? run : null;
      const seen = live ? markFade(live.tl, t) : () => 1;
      paintRoute(ctx, trip.shape, frameOf(trip, view, live ? live.tl.drawn(t) : 1, seen), ink, trip.names, width);
    },
    refresh(clear: Box): Pose<LatLng> | null {
      ink = readInk(canvas);
      width = tagWidth(ctx, ink);
      if (!open || run) return null;
      [trip, held] = [build(open.route, open.tint, clear), null];
      return trip.pose;
    },
  };
}
