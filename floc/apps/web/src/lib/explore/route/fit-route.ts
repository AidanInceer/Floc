import { project, unproject, type LatLng } from "@/lib/landing/globe/sphere";

import { legCurves } from "./curves";
import { sphere } from "./glide";
import type { TripRoute } from "./trip-route";

type Box = { left: number; top: number; right: number; bottom: number };

/**
 * The view and the sphere's radius that frame a route in `box`, keeping `room` px each side for names. The curves count,
 * not only the stops: a flight's arc bows out past both ends. `closest` caps the radius for a trip with one stop, or a small one.
 */
export function fitRoute(route: TripRoute, box: Box, room: { x: number; y: number }, closest: number): { view: LatLng; R: number } {
  const mid = sphere.mean(route.stops);
  const P = route.stops.map((s) => {
    const q = project(mid, s);
    return { x: q.x, y: -q.y };
  });
  const pts = [...P, ...legCurves(P, route.moves.map((m) => m?.mode ?? null), 12).flat()];
  const [xs, ys] = [pts.map((p) => p.x), pts.map((p) => p.y)];
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const view = unproject(mid, (x0 + x1) / 2, -(y0 + y1) / 2);
  // Why: a box narrower than the room (a card filling the band, a hidden tab) would give a negative radius, and canvas `arc` throws on one.
  const [w, h] = [Math.max(box.right - box.left - 2 * room.x, 1), Math.max(box.bottom - box.top - 2 * room.y, 1)];
  return { view, R: Math.min(w / Math.max(x1 - x0, 1e-9), h / Math.max(y1 - y0, 1e-9), closest) };
}

// Why: with the 1:50m outline and the trip's countries filled in, an inland trip still has coasts and borders in view this close.
const CLOSEST = { wide: 9000, narrow: 7000 };
const NARROW_BELOW = 600;
const ROOM = { wide: { x: 74, y: 44 }, narrow: { x: 46, y: 34 } };

export type RouteFraming = { view: LatLng; R: number; cx: number; cy: number; at: (s: LatLng) => { x: number; y: number } };

/** How every globe frames a route in the part of the band left `clear`, so it reads the same on Explore and on a trip. `foot` px at the bottom stay empty. */
export function frameRoute(route: TripRoute, clear: Box, foot = 0): RouteFraming {
  const narrow = clear.right - clear.left < NARROW_BELOW;
  const box = { ...clear, bottom: clear.bottom - foot };
  const { view, R } = fitRoute(route, box, narrow ? ROOM.narrow : ROOM.wide, narrow ? CLOSEST.narrow : CLOSEST.wide);
  const [cx, cy] = [(box.left + box.right) / 2, (box.top + box.bottom) / 2];
  const at = (s: LatLng) => {
    const q = project(view, s);
    return { x: cx + R * q.x, y: cy - R * q.y };
  };
  return { view, R, cx, cy, at };
}
