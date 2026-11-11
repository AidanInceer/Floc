import { placeTags, type Box, type Point } from "@/components/explore/atlas/tag-place";
import type { Piece, Shape } from "@/lib/explore/route/route-shape";

import type { RouteInk } from "./route-ink";

/** A name on the map, held to a stop or to the tip of a day out. A stop with nights has them written small beneath, in `sub`. */
export type Name = { of: "stop" | "out"; k: number; text: string; sub: string; w: number; h: number; dx: number; dy: number };

export const TAG = { h: 20, gap: 18 };

export const fonts = (ink: RouteInk) => ({
  stop: `600 12.5px ${ink.display}`,
  out: `italic 400 11.5px ${ink.sans}`,
  time: `500 10px ${ink.type}`,
});

/** How wide a leg's tag is with its time written in: the icon, the gap, the time. */
export function tagWidth(ctx: CanvasRenderingContext2D, ink: RouteInk) {
  ctx.font = fonts(ink).time;
  return (time: string) => 34 + ctx.measureText(time).width;
}

/** Where a leg's tag sits, at the view the route was built at: off the middle of the leg, on the outside of its bend. */
export function tagBox(p: Piece, at: Point, width: number): Box {
  const [x, y] = [at.x + p.bulge.x * TAG.gap, at.y + p.bulge.y * TAG.gap];
  return { left: x - width / 2, top: y - TAG.h / 2, right: x + width / 2, bottom: y + TAG.h / 2 };
}

function measure(ctx: CanvasRenderingContext2D, font: string, text: string) {
  ctx.font = font;
  return ctx.measureText(text).width;
}

/** Every name the map writes, placed clear of the stops, the tags and each other at the view the shape was built at. */
export function nameRoute(ctx: CanvasRenderingContext2D, shape: Shape, ink: RouteInk, view: Box): Name[] {
  const f = fonts(ink);
  const width = tagWidth(ctx, ink);
  const names: Omit<Name, "dx" | "dy">[] = [];
  const pins: Point[] = [];
  shape.stops.forEach((s, k) => {
    if (!s.named) return;
    const sub = s.nights > 0 ? `${s.nights} night${s.nights === 1 ? "" : "s"}` : "";
    const w = Math.max(measure(ctx, f.stop, s.place), sub ? measure(ctx, f.out, sub) : 0);
    names.push({ of: "stop", k, text: s.place, sub, w, h: sub ? 28 : 15 });
    pins.push(s.px);
  });
  shape.pieces.forEach((p, k) => {
    if (p.kind !== "out") return;
    names.push({ of: "out", k, text: p.name, sub: "", w: measure(ctx, f.out, p.name), h: 14 });
    pins.push(p.px[p.mid]!);
  });
  const avoid = shape.pieces.flatMap((p) => (p.mark ? [tagBox(p, p.px[p.mid]!, p.mark === "full" ? width(p.time) : TAG.h + 6)] : []));
  const line = shape.pieces.flatMap((p) => p.px.filter((_, i) => i % 3 === 0));
  const sizes = names.map((n) => ({ width: n.w, height: n.h, ...(n.sub ? { short: { width: measure(ctx, f.stop, n.text), height: 15 } } : {}) }));
  const spots = placeTags(pins, sizes, view, line, avoid);
  return names.flatMap((n, i) => {
    const at = spots[i];
    if (!at) return [];
    const kept = at.short ? { ...n, sub: "", w: sizes[i]!.short!.width, h: 15 } : n;
    return [{ ...kept, dx: at.x, dy: at.y }];
  });
}
