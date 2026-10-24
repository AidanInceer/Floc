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

/** A group's route on the globe, drawn once and still (no fly-in): framed in `clear`, its countries filled in `tint`. Returns the framing, for what is drawn over it. */
export function drawStillRoute(
  canvas: HTMLCanvasElement,
  paint: Painter,
  { route, land, tint, clear }: { route: TripRoute; land: { world: number[][][]; fine: number[][][] }; tint: Tint; clear: Box },
): RouteFraming | null {
  const ctx = canvas.getContext("2d");
  if (!ctx || route.stops.length === 0) return null;
  const ink = readInk(canvas);
  const width = tagWidth(ctx, ink);
  const fit = frameRoute(route, clear);
  const near = land.fine.length > 0 && fineAt(fit, domeFit(paint.box().w, clear));
  paint.base(fit.view, near ? land.fine : land.world, () => fit, tint);

  const shape = routeShape(route, fit.at, { samples: 40, loop: 44, least: 60, tagWidth: width });
  const frame = { pieces: shape.pieces.map((p) => p.px), stops: shape.stops.map((s) => s.px), drawn: 1, seen: () => 1, alpha: 1 };
  paintRoute(ctx, shape, frame, ink, nameRoute(ctx, shape, ink, clear), width);
  return fit;
}
