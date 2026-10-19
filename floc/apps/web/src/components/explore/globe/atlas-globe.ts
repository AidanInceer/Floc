import type { Box } from "@/components/explore/atlas/tag-place";
import { globeDrag } from "@/components/landing/globe/globe-drag";
import { globeTurn } from "@/components/landing/globe/globe-turn";
import { globePainter } from "@/components/landing/globe/paint-globe";
import { nudges, pinsOf } from "@/lib/landing/globe/deep";
import { flightAt, flightMs } from "@/lib/landing/globe/flight";
import { greatCircle, project, type LatLng } from "@/lib/landing/globe/sphere";

import { drawFlight, drawRoute, moveFlags, moveStops, type Route } from "./atlas-paint";
import { globeCamera } from "./camera";
import { domeFit, fineAt, fitAt, legMarks, over, routeFit } from "./dome";
import { routeClock } from "./route-clock";
import { placeNames } from "./stop-names";

/** `flags` holds one child a place and `stops` one child a place of the open route; the globe moves them. */
type GlobeDom = { flags: HTMLElement; stops: HTMLElement };
type Scene = { home: LatLng; places: LatLng[]; dom: GlobeDom; clear: () => Box };
const [TURN_MS, ZOOM_MS, SHUT_MS, LINE_MS, LINE_LEG_MS, LINE_MAX_MS] = [900, 1400, 1100, 400, 360, 2400];
// Why: a trip near the edge of the dome, or behind it, is turned to the top before the map goes in. A trip in plain view goes straight in.
const IN_VIEW = 0.35;
const FLIGHT_GONE = 0.3;
const PIN_GAP = 30;
const LANDED = { route: 1, landing: 1, done: true };
const clamp = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Explore's map with no tiles: the top of a paper globe with a pin on every trip. A pick turns the trip
 * to the top and flies the plane there from home. A route zooms in to it and draws it stop by stop.
 */
export function atlasGlobe(canvas: HTMLCanvasElement, { home, places, dom, clear }: Scene) {
  const paint = globePainter(canvas);
  if (!paint || places.length === 0) return null;
  const face = globeTurn(() => face.halt());
  const clock = routeClock();
  let land = { world: [] as number[][][], fine: [] as number[][][] };
  let [at, takeoff, then, frame, named] = [0, 0, 0, 0, -1];
  let [still, swapping] = [false, false];
  let route: Route | null = null;
  let path = greatCircle(home, places[0]!);
  const ms = (full: number) => (still ? 0 : full);
  const dome = () => domeFit(paint.box().w, clear());
  const fitNow = () => fitAt(clock.deep(), dome(), route?.fit ?? dome());
  const cam = globeCamera({ face, clock, fitNow });
  face.turnTo(over(places[0]!));

  const drag = globeDrag(canvas, {
    radius: paint.radius,
    view: face.view,
    // Why: a drag during a zoom would fight the camera; it takes hold once the map has arrived.
    turnTo(view) {
      if (!cam.busy()) face.turnTo(view);
    },
    onGrab() {
      face.halt();
      wake();
    },
    onRelease(speed) {
      if (!route) face.flick(speed);
      named = -1;
      wake();
    },
  });

  function flight(now: number) {
    if (still || route) return LANDED;
    if (!takeoff && face.progress() > 0.75) takeoff = now;
    return flightAt(takeoff, now, flightMs(home, places[at]!));
  }

  function moveRoute(view: LatLng) {
    if (!route) return;
    const deep = clock.deep();
    drawRoute(paint!, view, route, clock.drawn(), clamp((deep - 0.6) * 3.4));
    const { spots, shown } = moveStops(paint!, dom.stops, route, view, deep < 0.85 || swapping ? null : clock.drawn());
    // Why: measuring the names forces a layout, so it runs only when a stop has come or gone, never on every frame.
    if (shown === named) return;
    named = shown;
    placeNames(dom.stops, spots, route.pins, clear());
  }

  function step() {
    const now = performance.now();
    const dt = Math.min(50, now - then);
    then = now;
    clock.advance(now);
    if (clock.deep() === 0 && !clock.moving()) route = null;
    cam.aim();
    if (!drag.held() && !cam.busy()) face.advance(now, dt);
    const view = face.view();
    const near = land.fine.length > 0 && fineAt(fitNow(), dome());
    paint!.base(view, near ? land.fine : land.world, fitNow);
    const f = flight(now);
    const world = 1 - clamp(clock.deep() / FLIGHT_GONE);
    drawFlight(paint!, view, home, path, f, world);
    moveRoute(view);
    moveFlags(paint!, dom.flags, places, view, world);
    const busy = [drag.held(), face.moving(), clock.moving(), !f.done];
    frame = busy.some(Boolean) ? requestAnimationFrame(step) : 0;
  }

  function wake() {
    if (frame) return;
    then = performance.now();
    frame = requestAnimationFrame(step);
  }

  function goIn(stops: LatLng[]) {
    const { fit, view } = routeFit(stops, clear());
    const pins = pinsOf(stops);
    const hops = stops.slice(1).map((stop, k) => greatCircle(stops[k]!, stop, 24));
    route = { pins, offs: nudges(pins, fit.R, PIN_GAP), hops, marks: legMarks(stops), fit };
    [swapping, named] = [false, -1];
    const line = Math.min(LINE_MAX_MS, LINE_MS + LINE_LEG_MS * hops.length);
    cam.fly(view, { deep: 1, view, fit }, ms(ZOOM_MS), () => {
      named = -1;
      clock.draw(ms(hops.length ? line : 0));
    });
  }

  return {
    /** Turns the trip to the top of the dome; the plane then flies to it from home. */
    show(i: number) {
      if (i === at) return;
      [at, takeoff, path] = [i, 0, greatCircle(home, places[i]!)];
      if (!route) face.glide(over(places[i]!), ms(1500));
      wake();
    },
    /** Zooms in to one trip and draws its route, stop by stop. */
    open(stops: LatLng[]) {
      const top = over(places[at]!);
      const far = clock.deep() > 0 || project(face.view(), places[at]!).z < IN_VIEW;
      swapping = route !== null;
      if (far) cam.fly(places[at]!, { deep: 0, view: top, fit: dome() }, ms(clock.deep() > 0 ? SHUT_MS : TURN_MS), () => goIn(stops));
      else goIn(stops);
      wake();
    },
    /** Back to every trip. */
    close() {
      if (!route) return;
      cam.fly(places[at]!, { deep: 0, view: over(places[at]!), fit: dome() }, ms(SHUT_MS));
      wake();
    },
    start(reduced: boolean) {
      still = reduced;
      wake();
    },
    setLand(world: number[][][], fine: number[][][]) {
      land = { world, fine };
      wake();
    },
    redraw() {
      named = -1;
      wake();
    },
    stop() {
      cancelAnimationFrame(frame);
      drag.stop();
    },
  };
}
