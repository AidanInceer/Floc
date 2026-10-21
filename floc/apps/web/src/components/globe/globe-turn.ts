import { easeInOut } from "@/lib/landing/globe/flight";
import { turn, type LatLng } from "@/lib/landing/globe/sphere";

const clamp = (v: number) => Math.min(1, Math.max(0, v));

/** Where the globe faces: a glide to a view, or a flick that coasts and slows until `onRest` takes it. */
export function globeTurn(onRest: () => void) {
  let view: LatLng = { lng: 60, lat: 25 };
  let move = { at: turn(view, view), t0: 0, ms: 0, curve: easeInOut, u: 1, spin: false };
  let coast = 0;

  return {
    view: () => view,
    turnTo: (to: LatLng) => (view = to),
    /** How far through its glide the globe is, 0 to 1. */
    progress: () => move.u,
    spinning: () => move.spin && move.u < 1,
    coasting: () => coast !== 0,
    moving: () => coast !== 0 || move.u < 1,
    halt() {
      [move.u, coast] = [1, 0];
    },
    /** `speed` is in degrees a millisecond. */
    flick(speed: number) {
      coast = speed;
    },
    glide(to: LatLng, ms: number, turns = 0, curve = easeInOut) {
      coast = 0;
      move = { at: turn(view, to, turns), t0: performance.now(), ms, curve, u: 0, spin: turns > 0 };
    },
    advance(now: number, dt: number) {
      if (coast) {
        view = { ...view, lng: view.lng + coast * dt };
        coast *= 0.94 ** (dt / 16);
        if (Math.abs(coast) < 0.02) onRest();
      } else if (move.u < 1) {
        move.u = move.ms ? clamp((now - move.t0) / move.ms) : 1;
        view = move.at(move.curve(move.u));
      }
    },
  };
}
