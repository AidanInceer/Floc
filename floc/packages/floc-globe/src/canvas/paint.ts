import type { Countries } from "../countries";
import type { Fit, Size } from "../dome";
import { arc, limbRing, shortest, sightOf, type LatLng } from "../sphere";
import { spotOf } from "../screen";

export type MapState = "green" | "yellow";

const RAD = Math.PI / 180;
const INK = {
  sea: "--sheet-3",
  land: "--sheet",
  edge: "--pastel-blue-edge",
  green: "--green-2",
  greenEdge: "--green-edge",
  yellow: "--highlight",
  yellowEdge: "--highlight-edge",
  ink: "--ink",
} as const;
type Ink = Record<keyof typeof INK, string>;

/** The theme's colours, read off the page each paint so a switch to dark shows at once. */
function readInk(el: Element): Ink {
  const css = getComputedStyle(el);
  return Object.fromEntries(Object.entries(INK).map(([key, name]) => [key, css.getPropertyValue(name).trim()])) as Ink;
}

/**
 * Traces one land outline as seen from `view`. False when all of it is behind the globe.
 * Why the edge: land that runs behind is cut where it crosses the edge and followed along it; a straight line between the two crossings draws a flat side.
 */
export function traceRing(ctx: CanvasRenderingContext2D, { R, cx, cy }: Fit, view: LatLng, ring: number[][]): boolean {
  const out = limbRing(view, ring);
  if (!out) return false;
  ctx.beginPath();
  out.forEach((q, k) => {
    const p = out[(k + out.length - 1) % out.length]!;
    if ("x" in q) {
      const [x, y] = [cx + R * q.x, cy - R * q.y];
      return k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    if (k && "a" in p) return ctx.arc(cx, cy, R, -p.a, -q.a, shortest((q.a - p.a) / RAD) > 0);
    const [x, y] = [cx + R * Math.cos(q.a), cy - R * Math.sin(q.a)];
    return k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  });
  ctx.closePath();
  return true;
}

export type Scene = {
  box: Size;
  fit: Fit;
  view: LatLng;
  land: Countries;
  states: Record<string, MapState>;
  selected: string | null;
};

function disc(ctx: CanvasRenderingContext2D, { R, cx, cy }: Fit) {
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
}

const fillOf = (ink: Ink, state: MapState | undefined) =>
  state === "green" ? [ink.green, ink.greenEdge] : state === "yellow" ? [ink.yellow, ink.yellowEdge] : [ink.land, ink.edge];

/** The shapes that can show: the furthest corner of the box sets how far round the globe it sees. */
function inSight({ box, fit, view, land }: Scene) {
  const far = Math.hypot(Math.max(fit.cx, box.w - fit.cx), Math.max(fit.cy, box.h - fit.cy));
  const sight = sightOf(fit.R, far);
  return land.shapes.filter((s) => arc(view, s.centre) <= sight + s.reach);
}

/** The profile's travel globe: grey sea, white land, marked countries filled, the picked one outlined in ink. */
export function paintTravelGlobe(ctx: CanvasRenderingContext2D, scene: Scene) {
  const { box, fit, view, land, states, selected } = scene;
  const ink = readInk(ctx.canvas);
  ctx.clearRect(0, 0, box.w, box.h);
  ctx.fillStyle = ink.sea;
  disc(ctx, fit);
  ctx.fill();
  ctx.lineJoin = "round";
  const shapes = inSight(scene);
  // Marked countries last, so their edge is not drawn over by a neighbour's.
  for (const s of [...shapes.filter((s) => !states[s.code]), ...shapes.filter((s) => states[s.code])]) {
    if (!traceRing(ctx, fit, view, s.ring)) continue;
    [ctx.fillStyle, ctx.strokeStyle] = fillOf(ink, states[s.code]);
    ctx.lineWidth = 0.8;
    ctx.fill();
    ctx.stroke();
  }
  for (const d of land.dots) {
    const spot = spotOf(view, fit, d.at);
    if (!spot.front) continue;
    const state = states[d.code];
    [ctx.fillStyle, ctx.strokeStyle] = fillOf(ink, state);
    ctx.beginPath();
    ctx.arc(spot.x, spot.y, state ? 4 : 2.4, 0, Math.PI * 2);
    ctx.lineWidth = state ? 1.3 : 0.8;
    ctx.fill();
    ctx.stroke();
  }
  if (selected) outline(ctx, scene, ink.ink);
  ctx.strokeStyle = ink.edge;
  ctx.lineWidth = 1.5;
  disc(ctx, fit);
  ctx.stroke();
}

function outline(ctx: CanvasRenderingContext2D, { fit, view, land, selected }: Scene, ink: string) {
  ctx.strokeStyle = ink;
  ctx.lineWidth = 1.8;
  for (const s of land.shapes) if (s.code === selected && traceRing(ctx, fit, view, s.ring)) ctx.stroke();
  const dot = land.dots.find((d) => d.code === selected);
  const spot = dot && spotOf(view, fit, dot.at);
  if (!spot?.front) return;
  ctx.beginPath();
  ctx.arc(spot.x, spot.y, 6.5, 0, Math.PI * 2);
  ctx.stroke();
}
