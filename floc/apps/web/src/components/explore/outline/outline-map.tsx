"use client";

import type { PresetTrip } from "@floc/core/trip/explore/preset-trips";
import { useMemo } from "react";

import { landFor } from "@/components/explore/listing";
import { lineFor, ROUTE_SIZE } from "@/components/explore/route/route-ink";
import type { Point } from "@floc/core/trip/route/curves";
import { routeShape } from "@/lib/explore/route/route-shape";
import { tripRoute } from "@/lib/explore/route/trip-route";

import { tripCodes } from "./country";
import { drawOutline } from "./drawing";
import { LandPaths } from "./land-paths";
import { useLand } from "./use-land";

const OUTLINE_SIZES = {
  tile: { width: 240, height: 170 },
  pass: { width: 432, height: 216 },
} as const;

const { line: LINE, edge: EDGE, mid: MID, end: END } = ROUTE_SIZE.tile;
const tenth = (n: number) => Math.round(n * 10) / 10;
const pathOf = (pts: Point[]) => `M${pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join("L")}`;

export function OutlineMap({ trip, size }: { trip: PresetTrip; size: "tile" | "pass" }) {
  const land = useLand("fine");
  const box = OUTLINE_SIZES[size];
  const route = useMemo(() => tripRoute(trip), [trip]);
  const d = useMemo(() => drawOutline(route.stops, tripCodes(trip.country, route.stops, land), land, box), [route, trip.country, land, box]);
  const shape = useMemo(() => (d.frame ? routeShape(route, d.frame.point, { samples: 22, out: 15, least: Infinity }) : null), [route, d.frame]);
  const pieces = useMemo(() => shape?.pieces.filter((p) => p.kind !== "out") ?? [], [shape]);
  const home = landFor(trip);

  return (
    <svg
      viewBox={`0 0 ${box.width} ${box.height}`}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={`${route.stops.map((s) => s.place).join(", ")}, ${trip.country}`}
      className="block size-full"
    >
      <LandPaths home={d.home} other={d.other} islets={d.islets} fill={home} />
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
              <circle key={k} cx={tenth(s.px.x)} cy={tenth(s.px.y)} r={MID.r} strokeWidth={MID.ring} className="fill-sheet stroke-ink" />
            ) : (
              <circle key={k} cx={tenth(s.px.x)} cy={tenth(s.px.y)} r={END.r} strokeWidth={END.ring} className="fill-ink stroke-sheet" />
            ),
          )}
        </g>
      ) : null}
    </svg>
  );
}
