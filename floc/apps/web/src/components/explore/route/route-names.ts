import { placeTags, type Box, type Point } from "@/components/explore/atlas/tag-place";
import type { Piece, Shape } from "@/lib/explore/route/route-shape";

import type { RouteInk } from "./route-ink";

/** A name on the map, held to a stop or to the tip of a day out's loop. The start and the end are pills. */
export type Name = { of: "stop" | "loop"; k: number; text: string; caption: string; pill: "filled" | "open" | null; w: number; h: number; a: number; dx: number; dy: number };

const CAPTION = { start: "Start", end: "End", both: "Start and end", mid: "" } as const;
export const TAG = { h: 20, gap: 18 };
export const PILL = { h: 22, pad: 9, gap: 6, end: 10 };

export const fonts = (ink: RouteInk) => ({
  caption: `500 8px ${ink.type}`,
  pill: `600 13px ${ink.display}`,
  stop: `500 12px ${ink.sans}`,
  loop: `italic 400 11.5px ${ink.sans}`,
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
    const caption = CAPTION[s.role].toUpperCase();
    if (caption) {
      const a = measure(ctx, f.caption, caption) + caption.length * 0.6;
      const w = PILL.pad + a + PILL.gap + measure(ctx, f.pill, s.place) + PILL.end;
      names.push({ of: "stop", k, text: s.place, caption, pill: s.role === "end" ? "open" : "filled", w, h: PILL.h, a });
    } else names.push({ of: "stop", k, text: s.place, caption, pill: null, w: measure(ctx, f.stop, s.place), h: 15, a: 0 });
    pins.push(s.px);
  });
  shape.pieces.forEach((p, k) => {
    if (p.kind !== "loop") return;
    names.push({ of: "loop", k, text: p.name, caption: "", pill: null, w: measure(ctx, f.loop, p.name), h: 14, a: 0 });
    pins.push(p.px[p.mid]!);
  });
  const avoid = shape.pieces.flatMap((p) => (p.mark ? [tagBox(p, p.px[p.mid]!, p.mark === "full" ? width(p.time) : TAG.h + 6)] : []));
  const line = shape.pieces.flatMap((p) => p.px.filter((_, i) => i % 3 === 0));
  const spots = placeTags(pins, names.map((n) => ({ width: n.w, height: n.h })), view, line, avoid);
  return names.map((n, i) => ({ ...n, dx: spots[i]!.x, dy: spots[i]!.y }));
}
