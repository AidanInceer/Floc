import { easeInOut, easeOut, flightAt, flightMs } from "@/lib/landing/globe/flight";
import { faced, facing, greatCircle, nearest, type LatLng } from "@/lib/landing/globe/sphere";

import { globeDrag } from "./globe-drag";
import { drawPins } from "./globe-pins";
import { globeTurn } from "./globe-turn";
import { globePainter } from "./paint-globe";
import { wayIn, type WayDom } from "./way-in";

const LANDED = { route: 1, landing: 1, done: true };
const GROUNDED = { route: 0, landing: 0, done: true };

type Scene = {
  home: LatLng;
  places: LatLng[];
  onLight: (index: number) => void;
  /** The globe was turned by hand and came to rest on this place. */
  onSettle: (index: number) => void;
  onWay: (state: "open" | "shut") => void;
};

/**
 * The globe of the Borrow band: it turns to a place, then the plane flies the route from home.
 * Drag turns it, a flick spins it and the nearest place takes it. Frames run only while something moves.
 */
export function spinGlobe(canvas: HTMLCanvasElement, { home, places, onLight, onSettle, onWay }: Scene) {
  const paint = globePainter(canvas);
  if (!paint || places.length === 0) return null;
  const way = wayIn(paint, onWay);
  const face = globeTurn(() => settle(800));
  const paths = places.map((p) => greatCircle(home, p));
  let land: number[][][] = [];
  let hand: number[] = [];
  let [started, still] = [false, false];
  let [at, lit, held] = [0, -1, -1];
  let [takeoff, then, frame] = [0, 0, 0];

  function light(i: number) {
    if (i === lit) return;
    lit = i;
    onLight(i);
  }

  function glide(to: LatLng, ms: number, turns = 0, curve = easeInOut) {
    face.glide(to, still ? 0 : ms, turns, curve);
    wake();
  }

  function show(i: number, ms = 1500, turns = 0, curve = easeInOut) {
    [at, takeoff] = [i, 0];
    if (!turns || still) light(i);
    glide(facing(places[i]!), ms, turns, curve);
  }

  function settle(ms: number) {
    const i = nearest(face.view(), places);
    show(i, ms);
    onSettle(i);
  }

  const drag = globeDrag(canvas, {
    radius: paint.radius,
    view: face.view,
    turnTo: face.turnTo,
    onGrab() {
      face.halt();
      wake();
    },
    onRelease(speed) {
      if (way.isOpen()) return;
      face.flick(speed);
      if (Math.abs(speed) < 0.04 || still) settle(700);
    },
  });

  function flight(now: number, settled: boolean) {
    if (!started || !settled) return GROUNDED;
    if (still) return LANDED;
    if (!takeoff && face.progress() > 0.75) takeoff = now;
    return flightAt(takeoff, now, flightMs(home, places[at]!));
  }

  function step() {
    const now = performance.now();
    const dt = Math.min(50, now - then);
    then = now;
    way.advance(now);
    if (!drag.held()) face.advance(now, dt);
    const view = face.view();
    const open = way.isOpen();
    const settled = open || !(face.coasting() || drag.held());
    light(!settled || face.spinning() ? nearest(view, places) : at);
    const f = flight(now, settled);
    const pulsing = open ? -1 : held;
    paint!.base(view, land, way.frame);
    if (f.route) paint!.route(view, paths[at]!, f.route);
    drawPins(paint!, { view, home, places, hand, at, held: pulsing, still }, now, way.deep());
    if (f.route) paint!.plane(view, paths[at]!, f.route, f.landing);
    way.draw(view);
    const flying = started && settled && !f.done;
    const busy = [drag.held(), face.moving(), way.moving(), pulsing >= 0 && !still, flying];
    frame = busy.some(Boolean) ? requestAnimationFrame(step) : 0;
  }

  function wake() {
    if (frame) return;
    then = performance.now();
    frame = requestAnimationFrame(step);
  }

  light(0);
  wake();

  return {
    show: (i: number) => show(i),
    /** Two full turns, then the place asked for. */
    spin: (i: number) => show(i, 2800, 2, easeOut),
    /** The point of the world the globe is turned to, for the tiles that roll past as it spins. */
    passing: () => faced(face.view()),
    /** The places with a tile: each gets a pin, every other place a dot. */
    setHand(next: number[]) {
      hand = next;
      wake();
    },
    /** The place whose tile is under the pointer, or -1: its pin pulses. */
    hold(i: number) {
      held = i;
      wake();
    },
    open(i: number, stops: LatLng[], dom: WayDom) {
      if (i !== at) [at, takeoff] = [i, 0];
      light(i);
      way.open(stops, dom, still);
      glide(stops[0]!, 900);
    },
    close() {
      if (way.close(still)) glide(facing(places[at]!), 1100);
    },
    goTo: (k: number) => glide(way.goTo(k, still), 900),
    start(reduced: boolean) {
      [started, still] = [true, reduced];
      show(at);
    },
    setLand(rings: number[][][]) {
      land = rings;
      wake();
    },
    redraw: wake,
    stop() {
      cancelAnimationFrame(frame);
      drag.stop();
    },
  };
}
