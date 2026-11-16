import type { TransportType } from "@floc/core/vocabulary";

import { legCurves, spurCurve, type Point } from "@floc/core/trip/route/curves";
import type { RouteStop, TripRoute } from "./trip-route";

type Role = "start" | "end" | "both" | "mid";
type Mark = "full" | "icon" | null;
type ShapeStop = { place: string; nights: number; px: Point; role: Role; named: boolean; arrive: number };
export type Piece = {
  kind: "leg" | "out";
  mode: TransportType | null;
  time: string;
  name: string;
  to: number;
  px: Point[];
  cum: number[];
  len: number;
  a: number;
  b: number;
  mid: number;
  bulge: Point;
  mark: Mark;
};
export type Shape = { stops: ShapeStop[]; pieces: Piece[] };

type Options = { samples: number; out: number; least: number };

const sub = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y });
const unit = (a: Point): Point => {
  const l = Math.hypot(a.x, a.y) || 1;
  return { x: a.x / l, y: a.y / l };
};
const key = (s: RouteStop) => `${s.lat},${s.lng}`;
const MARK_ROOM = 16;

function rolesOf(stops: readonly RouteStop[]) {
  const last = stops.length - 1;
  const round = last === 0 || key(stops[0]!) === key(stops[last]!);
  const seen = new Set<string>();
  return stops.map((s, i) => {
    const named = !seen.has(key(s));
    seen.add(key(s));
    const role: Role = i === 0 ? (round ? "both" : "start") : i === last && !round ? "end" : "mid";
    return { role, named };
  });
}

function lengths(px: Point[]): number[] {
  const cum = [0];
  for (let i = 1; i < px.length; i++) cum.push(cum[i - 1]! + Math.hypot(px[i]!.x - px[i - 1]!.x, px[i]!.y - px[i - 1]!.y));
  return cum;
}

function bulgeOf(kind: Piece["kind"], px: Point[], mid: number): Point {
  const [a, b, m] = [px[0]!, px.at(-1)!, px[mid]!];
  if (kind === "out") return unit(sub(m, a));
  const off = sub(m, { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  if (Math.hypot(off.x, off.y) > 2) return unit(off);
  const tan = unit(sub(px[mid + 1]!, px[mid - 1]!));
  return { x: -tan.y, y: tan.x };
}

function markOf(kind: Piece["kind"], mode: Piece["mode"], time: string, px: Point[], { least }: Options): Mark {
  if (kind === "out" || (!mode && !time)) return null;
  const room = Math.hypot(px.at(-1)!.x - px[0]!.x, px.at(-1)!.y - px[0]!.y);
  if (room < least) return null;
  if (!mode) return "full";
  return "icon";
}

export function routeShape(route: TripRoute, at: (spot: { lat: number; lng: number }) => Point, options: Options): Shape {
  const P = route.stops.map(at);
  const legs = legCurves(P, route.moves.map((m) => m?.mode ?? null), options.samples);
  const centre = P.reduce((s, p) => ({ x: s.x + p.x / P.length, y: s.y + p.y / P.length }), { x: 0, y: 0 });
  const raw: Omit<Piece, "cum" | "len" | "a" | "b" | "mid" | "bulge" | "mark">[] = [];
  P.forEach((p, i) => {
    for (const out of (route.outs ?? []).filter((o) => o.at === i)) {
      const spot = out.lat !== undefined && out.lng !== undefined ? at({ lat: out.lat, lng: out.lng }) : null;
      let away = spot ? sub(spot, p) : sub(p, centre);
      let size = Math.max(spot ? Math.hypot(away.x, away.y) : 0, options.out);
      const tip = { x: p.x + unit(away).x * size, y: p.y + unit(away).y * size };
      if (spot && P.some((q, k) => k !== i && Math.hypot(tip.x - q.x, tip.y - q.y) < MARK_ROOM)) [away, size] = [sub(p, centre), options.out];
      if (Math.hypot(away.x, away.y) < 1) away = { x: 0, y: -1 };
      raw.push({ kind: "out", mode: out.mode, time: "", name: out.place, to: i, px: spurCurve(p, away, size, options.samples) });
    }
    const move = route.moves[i];
    if (i < legs.length) raw.push({ kind: "leg", mode: move?.mode ?? null, time: move?.time ?? "", name: "", to: i + 1, px: legs[i]! });
  });

  const measured = raw.map((r) => ({ ...r, cum: lengths(r.px) }));
  const total = measured.reduce((s, r) => s + r.cum.at(-1)!, 0) || 1;
  let run = 0;
  const pieces: Piece[] = measured.map((r) => {
    const len = r.cum.at(-1)!;
    const mid = Math.max(1, Math.min(r.px.length - 2, r.cum.findIndex((c) => c >= len / 2)));
    const a = run / total;
    run += len;
    return { ...r, len, a, b: run / total, mid, bulge: bulgeOf(r.kind, r.px, mid), mark: markOf(r.kind, r.mode, r.time, r.px, options) };
  });

  const roles = rolesOf(route.stops);
  return {
    pieces,
    stops: route.stops.map((s, i) => ({
      place: s.place,
      nights: s.nights ?? 0,
      px: P[i]!,
      ...roles[i]!,
      arrive: i === 0 ? 0 : pieces.find((p) => p.kind === "leg" && p.to === i)!.b,
    })),
  };
}

export function cut(pts: Point[], cum: number[], f: number): Point[] {
  if (f >= 1) return pts;
  const L = cum.at(-1)! * Math.max(0, f);
  let i = 1;
  while (i < cum.length - 1 && cum[i]! < L) i++;
  const t = (L - cum[i - 1]!) / (cum[i]! - cum[i - 1]! || 1);
  const [a, b] = [pts[i - 1]!, pts[i]!];
  return [...pts.slice(0, i), { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }];
}

export function penPoints(shape: Shape, n: number): Point[] {
  const { pieces, stops } = shape;
  return Array.from({ length: n + 1 }, (_, k) => {
    const g = k / n;
    const p = pieces.find((q) => g <= q.b) ?? pieces.at(-1);
    if (!p) return stops[0]!.px;
    return cut(p.px, p.cum, (g - p.a) / (p.b - p.a || 1)).at(-1)!;
  });
}
