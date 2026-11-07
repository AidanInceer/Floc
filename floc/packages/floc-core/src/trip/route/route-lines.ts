/**
 * The Overview route as lines a tiled map can draw: the same bends the web paints on its canvas (`legCurves`),
 * worked out on the flat Mercator sheet a north-up map shows, then handed back as [lng, lat].
 */
import type { TransportType } from "../../vocabulary";
import type { OverviewRoute } from "../overview/route";
import { legCurves, type Point } from "./curves";

export type RouteLine = {
  mode: TransportType | null;
  /** The tag's words: a journey's length, "Not set", or nothing. */
  time: string;
  coords: [number, number][];
  /** The line's middle: its arrow sits on it, its tag beside it. */
  mid: [number, number];
  /** The way the line runs at its middle on a north-up screen, in degrees: 0 is east, 90 is south. */
  angle: number;
  /** A unit step on screen (x east, y south) to the outside of the bend, where the tag goes so it never hides the line. */
  bulge: [number, number];
};

export type StopRole = "start" | "end" | "both" | "mid";

const RAD = Math.PI / 180;
const toSheet = (lng: number, lat: number): Point => ({ x: lng * RAD, y: -Math.log(Math.tan(Math.PI / 4 + (lat * RAD) / 2)) });
const fromSheet = (p: Point): [number, number] => [p.x / RAD, (2 * Math.atan(Math.exp(-p.y)) - Math.PI / 2) / RAD];
const unit = (x: number, y: number): [number, number] => {
  const l = Math.hypot(x, y) || 1;
  return [x / l, y / l];
};

/** As the web's `bulgeOf`: away from the chord where the line bends, else square to it. */
function bulgeOf(pts: Point[], half: number): [number, number] {
  const [a, b, m] = [pts[0], pts[pts.length - 1], pts[half]];
  const [ox, oy] = [m.x - (a.x + b.x) / 2, m.y - (a.y + b.y) / 2];
  if (Math.hypot(ox, oy) > 0.02 * Math.hypot(b.x - a.x, b.y - a.y)) return unit(ox, oy);
  const [tx, ty] = unit(pts[half + 1].x - pts[half - 1].x, pts[half + 1].y - pts[half - 1].y);
  return [-ty, tx];
}

export function routeLines(route: Pick<OverviewRoute, "stops" | "moves">, samples = 32): RouteLine[] {
  if (route.stops.length < 2) return [];
  const stops = route.stops.map((s) => toSheet(s.lng, s.lat));
  const curves = legCurves(stops, route.moves.map((m) => m.mode), samples);
  return curves.map((pts, k) => {
    const half = Math.floor(pts.length / 2);
    const [a, b] = [pts[half - 1], pts[half + 1]];
    return {
      mode: route.moves[k].mode,
      time: route.moves[k].time,
      coords: pts.map(fromSheet),
      mid: fromSheet(pts[half]),
      angle: Math.atan2(b.y - a.y, b.x - a.x) / RAD,
      bulge: bulgeOf(pts, half),
    };
  });
}

const key = (s: { lat: number; lng: number }) => `${s.lat},${s.lng}`;

/** As the web's `rolesOf`: the first stop starts and the last ends; a route back to where it began does both at the start. A place seen before is not named again. */
export function stopRoles(stops: { lat: number; lng: number }[]): { role: StopRole; named: boolean }[] {
  const last = stops.length - 1;
  const round = last === 0 || (last > 0 && key(stops[0]) === key(stops[last]));
  const seen = new Set<string>();
  return stops.map((s, i) => {
    const named = !seen.has(key(s));
    seen.add(key(s));
    const role: StopRole = i === 0 ? (round ? "both" : "start") : i === last && !round ? "end" : "mid";
    return { role, named };
  });
}
