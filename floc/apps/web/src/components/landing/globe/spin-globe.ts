import { easeInOut, easeOut, flightAt, flightMs } from "@/lib/landing/globe/flight";
import { globeTour, nextInHand } from "@/lib/landing/globe/tour";
import { faced, facing, greatCircle, nearest, type LatLng } from "@floc/globe/sphere";

import { frameLoop } from "@/components/globe/frame-loop";
import { globeDrag } from "@/components/globe/globe-drag";
import { globeTurn } from "@/components/globe/globe-turn";
import { globePainter } from "@/components/globe/paint-globe";
import type { Piece } from "@/components/explore/outline/land";
import type { BorrowCard } from "@/lib/landing/borrow";

import { tripTint } from "./trip-tint";
import { tripView } from "./trip-view";
import type { WayDom } from "./way-in";

const LANDED = { route: 1, landing: 1, done: true };
const GROUNDED = { route: 0, landing: 0, done: true };

type Scene = {
  home: LatLng;
  places: LatLng[];
  onLight: (index: number) => void;
  onSay: (index: number) => void;
  onSettle: (index: number) => void;
  onWay: (state: "open" | "shut") => void;
};

type Painter = NonNullable<ReturnType<typeof globePainter>>;

type Pins = { view: LatLng; home: LatLng; places: LatLng[]; hand: number[]; at: number; held: number; still: boolean };

const PULSE_MS = 1500;

function drawPins(paint: Painter, { view, home, places, hand, at, held, still }: Pins, now: number, deep: number) {
  if (deep >= 0.6) return;
  if (deep >= 0.3) return paint.pin(view, places[at]!, 7, true);
  const beat = still ? 0.4 : (now % PULSE_MS) / PULSE_MS;
  const swell = (i: number) => (i === held && !still ? 1 + 0.1 * Math.sin(beat * Math.PI * 2) : 1);
  places.forEach((p, i) => !hand.includes(i) && i !== at && paint.spot(view, p));
  if (held >= 0) paint.pulse(view, places[held]!, held === at ? 7 : 4, beat);
  hand.forEach((i) => i !== at && paint.pin(view, places[i]!, 4 * swell(i), i === held));
  paint.pin(view, home, 4, true);
  paint.pin(view, places[at]!, 7 * swell(at), true);
}

type Radius = Painter["radius"];
type Hooks = { grabbed: () => void; settle: (ms: number) => void; still: () => boolean };

function spinDrag(
  canvas: HTMLCanvasElement,
  radius: Radius,
  face: ReturnType<typeof globeTurn>,
  trip: ReturnType<typeof tripView>,
  { grabbed, settle, still }: Hooks,
) {
  return globeDrag(canvas, {
    radius,
    view: face.view,
    turnTo(view) {
      if (!trip.running()) face.turnTo(view);
    },
    onGrab() {
      face.halt();
      grabbed();
    },
    onRelease(speed) {
      if (trip.isOpen()) return;
      face.flick(speed);
      if (Math.abs(speed) < 0.04 || still()) settle(700);
    },
  });
}

export function spinGlobe(canvas: HTMLCanvasElement, { home, places, onLight, onSay, onSettle, onWay }: Scene) {
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
  const tour = globeTour(() => show(nextInHand(hand, at)));

  function light(i: number) {
    if (i !== lit) onLight((lit = i));
    if (!tour.touring()) onSay(i);
  }

  function glide(to: LatLng, ms: number, turns = 0, curve = easeInOut) {
    face.glide(to, still ? 0 : ms, turns, curve);
    wake();
  }

  function show(i: number, ms = 1500, turns = 0, curve = easeInOut) {
    if (trip.isOpen()) return;
    [at, takeoff] = [i, 0];
    if (!turns || still) light(i);
    glide(facing(places[i]!), ms, turns, curve);
  }

  function settle(ms: number) {
    tour.byPerson();
    const i = nearest(face.view(), places);
    show(i, ms);
    onSettle(i);
  }

  const grabbed = () => (tour.byPerson(), wake());
  const drag = spinDrag(canvas, paint.radius, face, trip, { grabbed, settle, still: () => still });
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
    tour.rest([started, !still, settled, !open, f.route === 1, !trip.moving(), !face.moving()].every(Boolean));
    const busy = [drag.held(), face.moving(), trip.moving(), pulsing >= 0 && !still, flying];
    return busy.some(Boolean);
  }

  light(0);
  wake();

  return {
    show: (i: number) => (tour.byPerson(), show(i)),
    spin: (i: number) => (tour.byPerson(), show(i, 2800, 2, easeOut)),
    seen: tour.seen,
    holdTour: tour.hold,
    setStill(next: boolean) {
      still = next;
      if (next) tour.rest(false);
      if (next && started) show(at);
      wake();
    },
    passing: () => faced(face.view()),
    setHand(next: number[]) {
      hand = next;
      wake();
    },
    hold(i: number) {
      held = i;
      wake();
    },
    open(i: number, card: Pick<BorrowCard, "place" | "region" | "route">, dom: WayDom) {
      tour.byPerson();
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
      tour.stop();
      loop.stop();
      canvas.removeEventListener("click", trip.skip);
      drag.stop();
    },
  };
}
