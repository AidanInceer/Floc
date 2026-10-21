import type { TransportType } from "@floc/core/vocabulary";

import type { Point } from "@/components/explore/atlas/tag-place";
import { cut, type Shape } from "@/lib/explore/route/route-shape";

import { MODE_PATHS, UNSET_PATHS } from "./mode-paths";
import { lineFor, type RouteInk } from "./route-ink";
import { fonts, PILL, TAG, tagBox, type Name } from "./route-names";

/**
 * One frame of a route on a canvas. `pieces` and `stops` are where the shape's points are now; `drawn` is how far the pen
 * has gone, 0 to 1; `seen(at)` how far in a mark is that the pen reached at `at` (a stop, a tag, a name each fade in on their own).
 */
export type RouteFrame = { pieces: Point[][]; stops: Point[]; drawn: number; seen: (at: number) => number; alpha: number };

const LINE = 1.9;
const CASE = 7;
const PATHS = new Map<string, Path2D>();
const path = (d: string) => PATHS.get(d) ?? PATHS.set(d, new Path2D(d)).get(d)!;

function stroke(ctx: CanvasRenderingContext2D, pts: Point[]) {
  if (pts.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(pts[0]!.x, pts[0]!.y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i]!.x, pts[i]!.y);
  ctx.stroke();
}

function dot(ctx: CanvasRenderingContext2D, p: Point, r: number, fill: string, ring: string, width: number) {
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.setLineDash([]);
  ctx.lineWidth = width;
  ctx.strokeStyle = ring;
  ctx.stroke();
}

function modeIcon(ctx: CanvasRenderingContext2D, mode: TransportType | null, at: Point, px: number, colour: string) {
  ctx.save();
  ctx.translate(at.x - px / 2, at.y - px / 2);
  ctx.scale(px / 14, px / 14);
  ctx.strokeStyle = colour;
  ctx.lineWidth = 1.25;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.setLineDash([]);
  for (const d of mode ? MODE_PATHS[mode] : UNSET_PATHS) ctx.stroke(path(d));
  ctx.restore();
}

function pill(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string, ring: string | null) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (!ring) return;
  ctx.setLineDash([]);
  ctx.lineWidth = 1;
  ctx.strokeStyle = ring;
  ctx.stroke();
}

/** The lines: a white edge under every road, rail and boat so it reads over any land, then the line itself, patterned by mode. */
function lines(ctx: CanvasRenderingContext2D, shape: Shape, drawn: Point[][], ink: RouteInk) {
  ctx.lineJoin = "round";
  ctx.strokeStyle = ink.sheet;
  ctx.setLineDash([]);
  ctx.lineCap = "round";
  ctx.lineWidth = CASE;
  drawn.forEach((pts, k) => {
    if (shape.pieces[k]!.mode !== "flight") stroke(ctx, pts);
  });
  ctx.strokeStyle = ink.ink;
  drawn.forEach((pts, k) => {
    const p = shape.pieces[k]!;
    const look = lineFor(p.mode, p.kind === "loop" ? LINE * 0.85 : LINE);
    ctx.lineWidth = look.width;
    ctx.setLineDash(look.dash);
    ctx.lineCap = look.cap;
    stroke(ctx, pts);
  });
  ctx.setLineDash([]);
}

/** Each leg's tag: the mode, and the time when the leg is long enough to hold it. */
function tags(ctx: CanvasRenderingContext2D, shape: Shape, f: RouteFrame, ink: RouteInk, width: (time: string) => number) {
  shape.pieces.forEach((p, k) => {
    const seen = f.seen((p.a + p.b) / 2);
    if (!p.mark || seen <= 0) return;
    const w = p.mark === "full" ? width(p.time) : TAG.h + 6;
    const at = f.pieces[k]![p.mid]!;
    const box = tagBox(p, { x: Math.round(at.x), y: Math.round(at.y) }, w);
    ctx.globalAlpha = f.alpha * seen;
    pill(ctx, box.left, box.top, w, TAG.h, ink.sheet, ink.rule);
    modeIcon(ctx, p.mode, { x: box.left + (p.mark === "full" ? 13 : w / 2), y: box.top + TAG.h / 2 }, 12, p.mode ? ink.ink : ink.ink2);
    if (p.mark === "full") {
      ctx.font = fonts(ink).time;
      ctx.fillStyle = ink.ink2;
      ctx.fillText(p.time, box.left + 23, box.top + 13.5);
    }
  });
  ctx.globalAlpha = f.alpha;
}

function stops(ctx: CanvasRenderingContext2D, shape: Shape, f: RouteFrame, ink: RouteInk) {
  const order = shape.stops.map((_, k) => k).sort((a, b) => Number(shape.stops[a]!.role !== "mid") - Number(shape.stops[b]!.role !== "mid"));
  for (const k of order) {
    const s = shape.stops[k]!;
    const seen = f.seen(s.arrive);
    if (seen <= 0) continue;
    ctx.globalAlpha = f.alpha * Math.min(1, seen * 2);
    const grow = 0.55 + 0.45 * seen;
    if (s.role === "mid") dot(ctx, f.stops[k]!, 4.4 * grow, ink.sheet, ink.ink, 1.8);
    else dot(ctx, f.stops[k]!, 6.5 * grow, ink.ink, ink.sheet, 2);
  }
  ctx.globalAlpha = f.alpha;
}

function write(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, font: string, colour: string, halo: string) {
  ctx.font = font;
  ctx.lineWidth = 3.5;
  ctx.lineJoin = "round";
  ctx.strokeStyle = halo;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = colour;
  ctx.fillText(text, x, y);
}

function names(ctx: CanvasRenderingContext2D, shape: Shape, f: RouteFrame, ink: RouteInk, list: Name[]) {
  const look = fonts(ink);
  for (const n of list) {
    const seen = f.seen(n.of === "stop" ? shape.stops[n.k]!.arrive : shape.pieces[n.k]!.b);
    if (seen <= 0) continue;
    const anchor = n.of === "stop" ? f.stops[n.k]! : f.pieces[n.k]![shape.pieces[n.k]!.mid]!;
    // Why: canvas text between whole pixels renders soft; snapped, it is as sharp as the page's own text.
    const [x, y] = [Math.round(anchor.x + n.dx), Math.round(anchor.y + n.dy + (1 - seen) * 4)];
    ctx.globalAlpha = f.alpha * seen;
    if (n.pill) {
      const filled = n.pill === "filled";
      const text = filled ? ink.sheet : ink.ink;
      pill(ctx, x, y, n.w, n.h, filled ? ink.ink : ink.sheet, filled ? null : ink.ink);
      ctx.font = look.caption;
      ctx.fillStyle = text;
      ctx.globalAlpha = f.alpha * seen * 0.72;
      ctx.fillText(n.caption, x + PILL.pad, y + 14.5);
      ctx.globalAlpha = f.alpha * seen;
      ctx.font = look.pill;
      ctx.fillText(n.text, x + PILL.pad + n.a + PILL.gap, y + 15.5);
    } else if (n.of === "loop") write(ctx, n.text, x, y + 11, look.loop, ink.ink2, ink.sheet);
    else write(ctx, n.text, x, y + 12, look.stop, ink.ink, ink.sheet);
  }
  ctx.globalAlpha = f.alpha;
}

/** A route in Explore's map style: ink line edged in white, a tag per leg, plain stops, the start and the end in ink pills. */
export function paintRoute(ctx: CanvasRenderingContext2D, shape: Shape, f: RouteFrame, ink: RouteInk, list: Name[], width: (time: string) => number) {
  if (f.alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = f.alpha;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  const drawn = shape.pieces.map((p, k) => cut(f.pieces[k]!, p.cum, (f.drawn - p.a) / (p.b - p.a || 1)));
  const live = drawn.map((pts, k) => (f.drawn > shape.pieces[k]!.a ? pts : []));
  lines(ctx, shape, live, ink);
  tags(ctx, shape, f, ink, width);
  const at = shape.pieces.findIndex((p) => f.drawn > p.a && f.drawn < p.b);
  if (at >= 0) dot(ctx, live[at]!.at(-1)!, 3.4, ink.ink, ink.sheet, 1.5);
  stops(ctx, shape, f, ink);
  names(ctx, shape, f, ink, list);
  ctx.restore();
}
