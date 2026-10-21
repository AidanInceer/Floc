import type { TripColor } from "@floc/core/trip/trip-color";

import type { Box } from "@/components/explore/atlas/tag-place";
import { domeFit, fineAt } from "@/components/explore/globe/dome";
import { paintRoute } from "@/components/explore/route/paint-route";
import { readInk } from "@/components/explore/route/route-ink";
import { nameRoute, tagWidth } from "@/components/explore/route/route-names";
import type { globePainter, Tint } from "@/components/landing/globe/paint-globe";
import { fitRoute } from "@/lib/explore/route/fit-route";
import { routeShape } from "@/lib/explore/route/route-shape";
import type { TripRoute } from "@/lib/explore/route/trip-route";
import { project, type LatLng } from "@/lib/landing/globe/sphere";

type Painter = NonNullable<ReturnType<typeof globePainter>>;

/** The tint a trip's countries take: the trip's own colour, as its card wears it. */
export const TONE: Record<TripColor, string> = { peri: "blue", mint: "green", butter: "yellow", blush: "red" };

// The same framing as Explore's open trip (trip-layer), so a route reads the same on both.
const CLOSEST = { wide: 9000, narrow: 7000 };
const NARROW_BELOW = 600;
const ROOM = { wide: { x: 74, y: 44 }, narrow: { x: 46, y: 34 } };

/** A group's route on the globe, drawn once and still (no fly-in): framed in `clear`, its countries filled in `tint`. */
export function drawStillRoute(
  canvas: HTMLCanvasElement,
  paint: Painter,
  { route, land, tint, clear }: { route: TripRoute; land: { world: number[][][]; fine: number[][][] }; tint: Tint; clear: Box },
) {
  const ctx = canvas.getContext("2d");
  if (!ctx || route.stops.length === 0) return;
  const ink = readInk(canvas);
  const width = tagWidth(ctx, ink);
  const narrow = clear.right - clear.left < NARROW_BELOW;
  const { view, R } = fitRoute(route, clear, narrow ? ROOM.narrow : ROOM.wide, narrow ? CLOSEST.narrow : CLOSEST.wide);
  const fit = { R, cx: (clear.left + clear.right) / 2, cy: (clear.top + clear.bottom) / 2 };
  const near = land.fine.length > 0 && fineAt(fit, domeFit(paint.box().w, clear));
  paint.base(view, near ? land.fine : land.world, () => fit, tint);

  const at = (s: LatLng) => {
    const q = project(view, s);
    return { x: fit.cx + R * q.x, y: fit.cy - R * q.y };
  };
  const shape = routeShape(route, at, { samples: 40, loop: 44, least: 60, tagWidth: width });
  const frame = { pieces: shape.pieces.map((p) => p.px), stops: shape.stops.map((s) => s.px), drawn: 1, seen: () => 1, alpha: 1 };
  paintRoute(ctx, shape, frame, ink, nameRoute(ctx, shape, ink, clear), width);
}
