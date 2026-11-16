import type { TransportType } from "../../vocabulary";
import type { OverviewRoute } from "../overview/route";
import { legCurves, type Point } from "./curves";

export type RouteLine = {
  mode: TransportType | null;
  time: string;
  coords: [number, number][];
  mid: [number, number];
  angle: number;
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
