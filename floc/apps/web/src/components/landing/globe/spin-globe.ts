import { easeInOut, easeOut, flightAt, flightMs } from "@/lib/landing/globe/flight";
import { facing, greatCircle, nearest, turn, type LatLng } from "@/lib/landing/globe/sphere";

import { globePainter } from "./paint-globe";

const LANDED = { route: 1, landing: 1, done: true };
const GROUNDED = { route: 0, landing: 0, done: true };
const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

type Scene = { home: LatLng; places: LatLng[]; onLight: (index: number) => void };

/**
 * The globe of the Borrow band: it turns to a place, then the plane flies the route from home.
 * Drag turns it, a flick spins it and the nearest place takes it. Frames run only while something moves.
 */
export function spinGlobe(canvas: HTMLCanvasElement, { home, places, onLight }: Scene) {
  const paint = globePainter(canvas);
  if (!paint || places.length === 0) return null;
  const paths = places.map((p) => greatCircle(home, p));
  let view: LatLng = { lng: 60, lat: 25 };
  let land: number[][][] = [];
  let [started, still] = [false, false];
  let [at, lit] = [0, -1];
  let move = { at: turn(view, view), t0: 0, ms: 0, curve: easeInOut, u: 1, spin: false };
  let [coast, takeoff, then, frame] = [0, 0, 0, 0];
  let drag: (LatLng & { x: number; y: number }) | null = null;
  let last = { x: 0, t: 0 };

  function light(i: number) {
    if (i === lit) return;
    lit = i;
    onLight(i);
  }

  function show(i: number, ms = 1500, turns = 0, curve = easeInOut) {
    [at, coast, takeoff] = [i, 0, 0];
    move = { at: turn(view, facing(places[i]!), turns), t0: performance.now(), ms: still ? 0 : ms, curve, u: 0, spin: turns > 0 };
    if (!turns || still) light(i);
    wake();
  }

  function advance(now: number, dt: number) {
    if (drag) return;
    if (coast) {
      view = { ...view, lng: view.lng + coast * dt };
      coast *= 0.94 ** (dt / 16);
      if (Math.abs(coast) < 0.02) show(nearest(view, places), 800);
    } else if (move.u < 1) {
      move.u = move.ms ? clamp((now - move.t0) / move.ms) : 1;
      view = move.at(move.curve(move.u));
    }
  }

  function flight(now: number, settled: boolean) {
    if (!started || !settled) return GROUNDED;
    if (still) return LANDED;
    if (!takeoff && move.u > 0.75) takeoff = now;
    return flightAt(takeoff, now, flightMs(home, places[at]!));
  }

  function step() {
    const now = performance.now();
    const dt = Math.min(50, now - then);
    then = now;
    advance(now, dt);
    const settled = !coast && !drag;
    light(!settled || (move.spin && move.u < 1) ? nearest(view, places) : at);
    const f = flight(now, settled);
    paint!.base(view, land);
    if (f.route) paint!.route(view, paths[at]!, f.route);
    places.forEach((p, i) => i !== at && paint!.pin(view, p, 4, false));
    paint!.pin(view, home, 4, true);
    paint!.pin(view, places[at]!, 7, true);
    if (f.route) paint!.plane(view, paths[at]!, f.route, f.landing);
    const moving = Boolean(drag) || coast !== 0 || move.u < 1 || (started && settled && !f.done);
    frame = moving ? requestAnimationFrame(step) : 0;
  }

  function wake() {
    if (frame) return;
    then = performance.now();
    frame = requestAnimationFrame(step);
  }

  function down(e: PointerEvent) {
    [move.u, coast] = [1, 0];
    drag = { x: e.clientX, y: e.clientY, ...view };
    last = { x: e.clientX, t: 0 };
    canvas.setPointerCapture(e.pointerId);
    wake();
  }
  function dragged(e: PointerEvent) {
    if (!drag) return;
    const k = 70 / paint!.radius();
    view = { lng: drag.lng - (e.clientX - drag.x) * k, lat: clamp(drag.lat + (e.clientY - drag.y) * k, -70, 70) };
    const now = performance.now();
    if (last.t && now > last.t) coast = coast * 0.6 + ((-(e.clientX - last.x) * k) / (now - last.t)) * 0.4;
    last = { x: e.clientX, t: now };
  }
  function up() {
    if (!drag) return;
    drag = null;
    if (performance.now() - last.t > 80) coast = 0;
    coast = clamp(coast, -0.9, 0.9);
    if (Math.abs(coast) < 0.04 || still) show(nearest(view, places), 700);
  }

  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", dragged);
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", up);
  light(0);
  wake();

  return {
    show: (i: number) => show(i),
    /** Two full turns, then a place other than the one it is on. */
    spin() {
      const roll = crypto.getRandomValues(new Uint32Array(1))[0]!;
      const pick = (at + 1 + (roll % Math.max(1, places.length - 1))) % places.length;
      show(pick, 2800, 2, easeOut);
    },
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
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", dragged);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
    },
  };
}
