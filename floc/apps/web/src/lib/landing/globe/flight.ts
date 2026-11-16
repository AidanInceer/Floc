import { apart, type LatLng } from "@floc/globe/sphere";

const clamp = (v: number) => Math.min(1, Math.max(0, v));

export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
export const easeOut = (t: number) => 1 - (1 - t) ** 3;

export const flightMs = (from: LatLng, to: LatLng) => 880 + 11.2 * apart(from, to);

export function flightAt(takeoff: number, now: number, ms: number) {
  if (!takeoff) return { route: 0, landing: 0, done: false };
  const u = clamp((now - takeoff) / ms);
  return { route: easeInOut(u), landing: clamp(u * 10 - 9), done: u >= 1 };
}
