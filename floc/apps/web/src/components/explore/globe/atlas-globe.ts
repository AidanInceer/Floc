import type { Box } from "@/components/explore/atlas/tag-place";
import { frameLoop } from "@/components/globe/frame-loop";
import { globeDrag } from "@/components/globe/globe-drag";
import { globeTurn } from "@/components/globe/globe-turn";
import { globePainter } from "@/components/globe/paint-globe";
import type { TripRoute } from "@/lib/explore/route/trip-route";
import { flightAt, flightMs } from "@/lib/landing/globe/flight";
import { greatCircle, type LatLng } from "@floc/globe/sphere";

import { drawFlight, moveFlags } from "./atlas-paint";
import { domeFit, fineAt, over, zoomed, type Fit } from "./dome";
import { fitOf, poseOf, tripLayer, type TripTint } from "./trip-layer";

type Scene = { home: LatLng; places: LatLng[]; flags: HTMLElement; clear: () => Box };
const LANDED = { route: 1, landing: 1, done: true };

export function atlasGlobe(canvas: HTMLCanvasElement, { home, places, flags, clear }: Scene) {
  const paint = globePainter(canvas);
  if (!paint || places.length === 0) return null;
  const loop = frameLoop(step);
  const wake = loop.wake;
  const face = globeTurn(() => face.halt());
  const trips = tripLayer(canvas, paint);
  let land = { world: [] as number[][][], fine: [] as number[][][] };
  let [at, takeoff, world] = [0, 0, 1];
  let still = false;
  let [zoom, zoomTo] = [1, 1];
  let moving: Fit | null = null;
  let path = greatCircle(home, places[0]!);
  const width = () => clear().right - clear().left;
  const whole = () => domeFit(paint.box().w, clear());
  const dome = () => zoomed(whole(), zoom);
  const fitNow = () => moving ?? trips.rest(width()) ?? dome();
  face.turnTo(over(places[0]!));

  const drag = globeDrag(canvas, {
    radius: paint.radius,
    view: face.view,
    turnTo(view) {
      if (!trips.running()) face.turnTo(view);
    },
    onGrab() {
      face.halt();
      wake();
    },
    onRelease(speed) {
      if (!trips.isOpen()) face.flick(speed);
      wake();
    },
  });
  canvas.addEventListener("click", trips.skip);

  function flight(now: number) {
    if (still || trips.isOpen()) return LANDED;
    if (!takeoff && face.progress() > 0.75) takeoff = now;
    return flightAt(takeoff, now, flightMs(home, places[at]!));
  }

  function step(now: number, dt: number) {
    if (zoom !== zoomTo) zoom = still || Math.abs(zoomTo - zoom) < 0.002 ? zoomTo : zoom + (zoomTo - zoom) * (1 - Math.exp(-dt / 140));
    const move = trips.advance(now, still);
    world = move.world;
    moving = move.pose ? fitOf(move.pose, width()) : null;
    if (move.pose) face.turnTo(move.pose.centre);
    else if (!drag.held()) face.advance(now, dt);
    const view = face.view();
    const near = land.fine.length > 0 && fineAt(fitNow(), whole());
    paint!.base(view, near ? land.fine : land.world, fitNow, trips.tint());
    const f = flight(now);
    drawFlight(paint!, view, home, path, f, world);
    trips.draw(view);
    moveFlags(paint!, flags, places, view, world);
    const busy = [drag.held(), face.moving(), trips.running(), !f.done, zoom !== zoomTo];
    return busy.some(Boolean);
  }

  return {
    show(i: number) {
      if (i === at) return;
      [at, takeoff, path] = [i, 0, greatCircle(home, places[i]!)];
      if (!trips.isOpen()) face.glide(over(places[i]!), still ? 0 : 1500);
      wake();
    },
    open(route: TripRoute, tint: TripTint) {
      face.halt();
      trips.open(route, tint, poseOf(fitNow(), face.view(), width()), clear());
      wake();
    },
    close() {
      if (!trips.isOpen()) return;
      trips.close(poseOf(fitNow(), face.view(), width()), poseOf(dome(), over(places[at]!), width()));
      wake();
    },
    zoom(level: number) {
      zoomTo = level;
      wake();
    },
    start(reduced: boolean) {
      still = reduced;
      wake();
    },
    setLand(worldRings: number[][][], fine: number[][][]) {
      land = { world: worldRings, fine };
      wake();
    },
    redraw() {
      const pose = trips.refresh(clear());
      if (pose) face.turnTo(pose.centre);
      wake();
    },
    stop() {
      loop.stop();
      canvas.removeEventListener("click", trips.skip);
      drag.stop();
    },
  };
}
