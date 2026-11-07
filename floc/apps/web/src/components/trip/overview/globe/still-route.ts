import type { TripColor } from "@floc/core/trip/trip-color";

import type { Box } from "@/components/explore/atlas/tag-place";
import { domeFit, fineAt } from "@/components/explore/globe/dome";
import { paintRoute } from "@/components/explore/route/paint-route";
import { readInk } from "@/components/explore/route/route-ink";
import { nameRoute, tagWidth } from "@/components/explore/route/route-names";
import type { globePainter, Tint } from "@/components/globe/paint-globe";
import { frameRoute, type RouteFraming } from "@/lib/explore/route/fit-route";
import { routeShape } from "@/lib/explore/route/route-shape";
import type { TripRoute } from "@/lib/explore/route/trip-route";

type Painter = NonNullable<ReturnType<typeof globePainter>>;

/** The tint a trip's countries take: the trip's own colour, as its card wears it. */
export const TONE: Record<TripColor, string> = { peri: "blue", mint: "green", butter: "yellow", blush: "red" };

/**
 * A group's route on the globe, drawn once and still (no fly-in): framed in `clear`, its countries filled in `tint`. Returns the framing, for what is drawn over it.
 * `quiet` drops the stop names and the leg tags, for a map the size of a bar on My trips.
 */
export function drawStillRoute(
  canvas: HTMLCanvasElement,
  paint: Painter,
  {
    route,
    land,
    tint,
    clear,
    quiet = false,
  }: { route: TripRoute; land: { world: number[][][]; fine: number[][][] }; tint: Tint; clear: Box; quiet?: boolean },
): RouteFraming | null {
  const ctx = canvas.getContext("2d");
  if (!ctx || route.stops.length === 0) return null;
  const ink = readInk(canvas);
  const width = tagWidth(ctx, ink);
  const fit = frameRoute(route, clear);
  const near = land.fine.length > 0 && fineAt(fit, domeFit(paint.box().w, clear));
  paint.base(fit.view, near ? land.fine : land.world, () => fit, tint);

  // Why: with no names beside it, a lone start disc reads as a play button, so one stop on a bar is a plain dot.
  if (quiet && route.stops.length === 1) {
    const p = fit.at(route.stops[0]!);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = ink.ink;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = ink.sheet;
    ctx.stroke();
    return fit;
  }
  const drawn = routeShape(route, fit.at, { samples: 40, out: 44, least: 60 });
  const shape = quiet ? { ...drawn, pieces: drawn.pieces.map((p) => ({ ...p, mark: null })) } : drawn;
  const frame = { pieces: shape.pieces.map((p) => p.px), stops: shape.stops.map((s) => s.px), drawn: 1, seen: () => 1, alpha: 1 };
  paintRoute(ctx, shape, frame, ink, quiet ? [] : nameRoute(ctx, shape, ink, clear), width);
  return fit;
}
