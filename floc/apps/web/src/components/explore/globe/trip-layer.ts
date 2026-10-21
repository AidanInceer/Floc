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
import { unproject, type LatLng } from "@/lib/landing/globe/sphere";

import type { Fit } from "./dome";

type Painter = NonNullable<ReturnType<typeof globePainter>>;
/** The countries a trip passes through and the region colour to fill them in. */
export type TripTint = { rings: ReadonlySet<number[][]>; tone: string };
/** One trip as the globe draws it, built at the view that frames it; its points are kept on the sphere so the route turns with the globe. */
type Built = { shape: Shape; pieces: LatLng[][]; stops: LatLng[]; names: Name[]; look: (g: number) => LatLng; length: number; pose: Pose<LatLng>; tint: TripTint };
type Run = { tl: Timeline<LatLng>; t0: number; closing: boolean; fromDome: boolean };

const FOOT = 36;
const PINS_GONE_MS = 450;
const clamp = (v: number) => Math.min(1, Math.max(0, v));

/** A view of the globe as a pose: the place at the sphere's middle, which sits at (cx, cy); `w` is the clear width over the radius. */
export const poseOf = (fit: Fit, view: LatLng, width: number): Pose<LatLng> => ({ centre: view, w: width / fit.R, at: { x: fit.cx, y: fit.cy } });
export const fitOf = (pose: Pose<LatLng>, width: number): Fit => ({ R: width / pose.w, cx: pose.at.x, cy: pose.at.y });

/** The open trip on Explore's globe: its route, and the moves of the map into it, between trips and back out. */
export function tripLayer(canvas: HTMLCanvasElement, paint: Painter) {
  const ctx = canvas.getContext("2d")!;
  let ink = readInk(canvas);
  let width = tagWidth(ctx, ink);
  let [trip, old, run, t] = [null as Built | null, null as Built | null, null as Run | null, 0];
  let open: { route: TripRoute; tint: TripTint } | null = null;

  function build(route: TripRoute, tint: TripTint, clear: Box): Built {
    // Why: the band fades into the page at its foot, and "Every trip" sits there, so a name there would be lost.
    const fit = frameRoute(route, clear, FOOT);
    const { view, R, at } = fit;
    const back = (p: { x: number; y: number }) => unproject(view, (p.x - fit.cx) / R, (fit.cy - p.y) / R);
    const shape = routeShape(route, at, { samples: 40, loop: 44, least: 60, tagWidth: width });
    return {
      shape,
      pieces: shape.pieces.map((p) => p.px.map(back)),
      stops: route.stops,
      names: nameRoute(ctx, shape, ink, clear),
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
    /** Opens a trip from the view the map is at: fly in close, follow the pen, ease out to the whole trip. */
    open(route: TripRoute, tint: TripTint, from: Pose<LatLng>, clear: Box) {
      old = trip;
      open = { route, tint };
      trip = build(route, tint, clear);
      run = { tl: followPen(sphere, { from, to: trip.pose, look: trip.look, length: trip.length }), t0: performance.now(), closing: false, fromDome: old === null };
    },
    /** Back out to every trip, to the view `to`. */
    close(from: Pose<LatLng>, to: Pose<LatLng>) {
      if (!trip) return;
      [old, trip, open] = [trip, null, null];
      run = { tl: glideTo(sphere, from, to), t0: performance.now(), closing: true, fromDome: false };
    },
    skip() {
      if (run && !run.closing) run.t0 = performance.now() - run.tl.skip;
    },
    /** Moves the clock on: the view the map should take, and how much of every trip's pins and the flight show (`world`). */
    advance(now: number, still: boolean): { pose: Pose<LatLng> | null; world: number } {
      if (!run) return { pose: null, world: trip ? 0 : 1 };
      t = still ? run.tl.ms : Math.min(run.tl.ms, now - run.t0);
      const { tl, closing, fromDome } = run;
      const world = closing ? clamp((t / tl.ms - 0.6) / 0.4) : fromDome ? 1 - clamp(t / PINS_GONE_MS) : 0;
      const pose = tl.pose(t);
      if (t >= tl.ms) [run, old] = [null, null];
      return { pose, world };
    },
    /** Where the sphere rests once a trip is open; null on the dome. */
    rest: (W: number): Fit | null => (trip ? fitOf(trip.pose, W) : null),
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
      const live = run;
      const seen = live ? markFade(live.tl, t) : () => 1;
      paintRoute(ctx, trip.shape, frameOf(trip, view, live ? live.tl.drawn(t) : 1, seen), ink, trip.names, width);
    },
    /** New theme or new size: read the tokens again and, with no move running, build the open trip again for the clear part. */
    refresh(clear: Box): Pose<LatLng> | null {
      ink = readInk(canvas);
      width = tagWidth(ctx, ink);
      if (!open || run) return null;
      trip = build(open.route, open.tint, clear);
      return trip.pose;
    },
  };
}
