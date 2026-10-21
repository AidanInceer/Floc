"use client";

import type { PresetTrip } from "@floc/core/trip/explore/preset-trips";
import { useMemo } from "react";

import { landFor } from "@/components/explore/listing";
import { lineFor, ROUTE_SIZE } from "@/components/explore/route/route-ink";
import type { Point } from "@/lib/explore/route/curves";
import { routeShape } from "@/lib/explore/route/route-shape";
import { tripRoute } from "@/lib/explore/route/trip-route";

import { tripCodes } from "./country";
import { drawOutline } from "./drawing";
import { useLand } from "./use-land";

// Why: each place a tile goes has a drawing at the size it is shown, so a line keeps its width.
const OUTLINE_SIZES = {
  tile: { width: 240, height: 170 },
  pass: { width: 432, height: 216 },
} as const;

const { line: LINE, edge: EDGE, mid: MID, end: END } = ROUTE_SIZE.tile;
const pathOf = (pts: Point[]) => `M${pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join("L")}`;

/**
 * A listing's route on the outline of its countries, small, for a tile: the line in the map's own style (patterned by how you
 * travel), the start and the end in ink, no names. No tile layer: the shapes come from `public/land-50m.json`.
 */
export function OutlineMap({ trip, size }: { trip: PresetTrip; size: "tile" | "pass" }) {
  const land = useLand("fine");
  const box = OUTLINE_SIZES[size];
  const route = useMemo(() => tripRoute(trip), [trip]);
  const d = useMemo(() => drawOutline(route.stops, tripCodes(trip.country, route.stops, land), land, box), [route, trip.country, land, box]);
  const shape = useMemo(() => (d.frame ? routeShape(route, d.frame.point, { samples: 22, loop: 15, least: Infinity }) : null), [route, d.frame]);
  // Why: at tile size a day trip's loop crowds its stop's mark into a smudge; the pass draws them.
  const pieces = useMemo(() => shape?.pieces.filter((p) => p.kind !== "loop") ?? [], [shape]);
  const home = landFor(trip);

  return (
    <svg
      viewBox={`0 0 ${box.width} ${box.height}`}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={`${route.stops.map((s) => s.place).join(", ")}, ${trip.country}`}
      className="block size-full"
    >
      {/* Why: the trip's countries go under the rest, so where two shapes overlap (Morocco and Western Sahara) the drawn border wins. */}
      <path d={d.home} className={home} />
      <path d={d.other} strokeWidth={0.75} className="fill-sheet-3 stroke-rule-strong" />
      {d.islets.map((islet) => (
        <circle key={`${islet.x} ${islet.y}`} cx={islet.x} cy={islet.y} r={islet.r} className={home} />
      ))}
      {shape ? (
        <g fill="none" strokeLinejoin="round">
          {pieces.map((p, k) =>
            p.mode === "flight" ? null : <path key={`case-${k}`} d={pathOf(p.px)} strokeWidth={EDGE} strokeLinecap="round" className="stroke-sheet" />,
          )}
          {pieces.map((p, k) => {
            const look = lineFor(p.mode, LINE);
            return <path key={`line-${k}`} d={pathOf(p.px)} strokeWidth={look.width} strokeDasharray={look.dash.join(" ") || undefined} strokeLinecap={look.cap} className="stroke-ink" />;
          })}
          {shape.stops.map((s, k) =>
            !s.named ? null : s.role === "mid" ? (
              <circle key={k} cx={s.px.x} cy={s.px.y} r={MID.r} strokeWidth={MID.ring} className="fill-sheet stroke-ink" />
            ) : (
              <circle key={k} cx={s.px.x} cy={s.px.y} r={END.r} strokeWidth={END.ring} className="fill-ink stroke-sheet" />
            ),
          )}
        </g>
      ) : null}
    </svg>
  );
}
