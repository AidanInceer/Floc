import type { globeTurn } from "@/components/landing/globe/globe-turn";
import { project, type LatLng } from "@/lib/landing/globe/sphere";

import { viewFor, type Fit } from "./dome";
import type { routeClock } from "./route-clock";

type Point = { x: number; y: number };
/** One move: `target` goes from one point on the canvas to another. */
type Move = { target: LatLng; from: Point; to: Point };
type Parts = { face: ReturnType<typeof globeTurn>; clock: ReturnType<typeof routeClock>; fitNow: () => Fit };

function pointOf(fit: Fit, view: LatLng, place: LatLng): Point {
  const q = project(view, place);
  return { x: fit.cx + fit.R * q.x, y: fit.cy - fit.R * q.y };
}

/**
 * Turns the globe in step with the zoom. Why: a place then moves in one straight line from where it is
 * to where it ends; a turn on its own timer swings the place off the screen and back, which reads as a jolt.
 */
export function globeCamera({ face, clock, fitNow }: Parts) {
  let move: Move | null = null;

  return {
    busy: () => move !== null,
    /** Heads for `deep`, with `target` gliding to where it sits under `view` on a sphere `fit`. */
    fly(target: LatLng, to: { deep: number; view: LatLng; fit: Fit }, ms: number, after: (() => void) | null = null) {
      const view = face.view();
      face.halt();
      move = { target, from: pointOf(fitNow(), view, target), to: pointOf(to.fit, to.view, target) };
      clock.go(to.deep, ms, after);
    },
    /** Once a frame, after the clock: the view for where the zoom has got to. */
    aim() {
      if (!move) return;
      const u = clock.progress();
      const { from, to } = move;
      face.turnTo(viewFor(fitNow(), move.target, { x: from.x + (to.x - from.x) * u, y: from.y + (to.y - from.y) * u }));
      if (!clock.zooming()) move = null;
    },
  };
}
