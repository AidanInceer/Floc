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
  const [w, h] = [box.right - box.left - 2 * room.x, box.bottom - box.top - 2 * room.y];
  return { view, R: Math.min(w / Math.max(x1 - x0, 1e-9), h / Math.max(y1 - y0, 1e-9), closest) };
}
