import { easeInOut, easeOut, flightAt, flightMs } from "@/lib/landing/globe/flight";
import { faced, facing, greatCircle, nearest, type LatLng } from "@floc/globe/sphere";

import { frameLoop } from "@/components/globe/frame-loop";
import { globeDrag } from "@/components/globe/globe-drag";
import { globeTurn } from "@/components/globe/globe-turn";
import { globePainter } from "@/components/globe/paint-globe";
import type { Piece } from "@/components/explore/outline/land";
import type { BorrowCard } from "@/lib/landing/borrow";

import { drawPins } from "./globe-pins";
import { tripTint } from "./trip-tint";
import { tripView } from "./trip-view";
import type { WayDom } from "./way-in";

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
  const loop = frameLoop(step);
  const wake = loop.wake;
  const face = globeTurn(() => settle(800));
  const trip = tripView(canvas, paint, face, onWay);
  const paths = places.map((p) => greatCircle(home, p));
  let [pieces, land, hand]: [readonly Piece[], number[][][], number[]] = [[], [], []];
  let [started, still] = [false, false];
  let [at, lit, held, takeoff] = [0, -1, -1, 0];

  function light(i: number) {
    if (i !== lit) onLight((lit = i));
  }

  function glide(to: LatLng, ms: number, turns = 0, curve = easeInOut) {
    face.glide(to, still ? 0 : ms, turns, curve);
    wake();
  }

  function show(i: number, ms = 1500, turns = 0, curve = easeInOut) {
    // Why: the first sight of the band, a spin or a hover can land while a trip is open; the route holds the camera then.
    if (trip.isOpen()) return;
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
    // Why: a drag during a move would fight the camera; it takes hold once the map has arrived.
    turnTo(view) {
      if (!trip.running()) face.turnTo(view);
    },
    onGrab() {
      face.halt();
      wake();
    },
    onRelease(speed) {
      if (trip.isOpen()) return;
      face.flick(speed);
      if (Math.abs(speed) < 0.04 || still) settle(700);
    },
  });
  canvas.addEventListener("click", trip.skip);

  function flight(now: number, settled: boolean) {
    if (!started || !settled) return GROUNDED;
    if (still) return LANDED;
    if (!takeoff && face.progress() > 0.75) takeoff = now;
    return flightAt(takeoff, now, flightMs(home, places[at]!));
  }

  function step(now: number, dt: number) {
    const pose = trip.advance(now, still);
    if (pose) face.turnTo(pose.centre);
    else if (!drag.held()) face.advance(now, dt);
    const view = face.view();
    const open = trip.isOpen();
    const settled = open || !(face.coasting() || drag.held());
    light(!settled || face.spinning() ? nearest(view, places) : at);
    const f = open ? GROUNDED : flight(now, settled);
    const pulsing = open ? -1 : held;
    paint!.base(view, land, trip.fitNow, trip.tint());
    if (f.route) paint!.route(view, paths[at]!, f.route);
    drawPins(paint!, { view, home, places, hand, at, held: pulsing, still }, now, trip.deep());
    if (f.route) paint!.plane(view, paths[at]!, f.route, f.landing);
    trip.draw(view);
    const flying = started && settled && !f.done;
    const busy = [drag.held(), face.moving(), trip.moving(), pulsing >= 0 && !still, flying];
    return busy.some(Boolean);
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
    open(i: number, card: Pick<BorrowCard, "place" | "region" | "route">, dom: WayDom) {
      if (i !== at) [at, takeoff] = [i, 0];
      light(i);
      trip.open(card.route, () => tripTint(pieces, card), dom, still);
      glide(card.route.stops[0]!, 900);
    },
    close() {
      if (trip.close(still)) glide(facing(places[at]!), 1100);
    },
    goTo: (k: number) => (trip.goTo(k), wake()),
    replay: () => (trip.replay(), wake()),
    start(reduced: boolean) {
      [started, still] = [true, reduced];
      show(at);
    },
    setLand(next: readonly Piece[]) {
      [pieces, land] = [next, next.map((p) => p.ring)];
      trip.retint();
      wake();
    },
    redraw() {
      const pose = trip.redraw();
      if (pose) face.turnTo(pose.centre);
      wake();
    },
    stop() {
      loop.stop();
      canvas.removeEventListener("click", trip.skip);
      drag.stop();
    },
  };
}
