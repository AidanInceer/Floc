import { apart, type LatLng } from "./sphere";

const clamp = (v: number) => Math.min(1, Math.max(0, v));

export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
export const easeOut = (t: number) => 1 - (1 - t) ** 3;

/** How long the plane takes: a fixed take-off, then longer the further the trip is. */
export const flightMs = (from: LatLng, to: LatLng) => 880 + 11.2 * apart(from, to);

/**
 * The flight at `now`: how much of the route is drawn, and how far the plane has faded
 * into the pin. `takeoff` is 0 until the globe has settled.
 */
export function flightAt(takeoff: number, now: number, ms: number) {
  if (!takeoff) return { route: 0, landing: 0, done: false };
  const u = clamp((now - takeoff) / ms);
  return { route: easeInOut(u), landing: clamp(u * 10 - 9), done: u >= 1 };
}
