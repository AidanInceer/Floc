"use client";

import type { GroupRoute } from "@floc/api/port";
import type { OverviewRoute } from "@floc/core/trip/overview/route";
import type { TripColor } from "@floc/core/trip/trip-color";
import { useEffect, useRef } from "react";

import { codesAt, ringsIn } from "@/components/explore/outline/land";
import { useLand } from "@/components/explore/outline/use-land";
import { globePainter } from "@/components/globe/paint-globe";
import { watchRedraw } from "@/components/globe/watch-redraw";

import { clearArea } from "./clear-area";
import { paintTracks, placeTracks } from "./paint-tracks";
import { drawStillRoute, TONE } from "./still-route";

/**
 * The trip's route on Explore's tile-free globe, still: no fly-in on a page the group opens again and again.
 * It is drawn from the days each time the page loads, so a change on Days is simply there.
 */
const NO_TRACKS: GroupRoute[] = [];

export function OverviewGlobe({
  route,
  tone,
  label,
  tracks = NO_TRACKS,
}: {
  route: OverviewRoute;
  tone: TripColor;
  label: string;
  tracks?: GroupRoute[];
}) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const world = useLand("world");
  const fine = useLand("fine");

  useEffect(() => {
    const [box, node] = [host.current, canvas.current];
    const paint = node ? globePainter(node) : null;
    if (!box || !node || !paint) return;
    // Why: a place saved before ticket 95 has no country stored, so the outline says where it stands.
    const codes = new Set([...route.countries, ...codesAt(fine, route.uncoded)]);
    const tint = { rings: ringsIn(world, fine, codes), tone: TONE[tone], alpha: 1 };
    const land = { world: world.map((p) => p.ring), fine: fine.map((p) => p.ring) };
    const draw = () => {
      const card = box.closest("[data-overview-band]")?.querySelector("[data-overview-card]");
      const fit = drawStillRoute(node, paint, { route, land, tint, clear: clearArea(box.getBoundingClientRect(), card?.getBoundingClientRect() ?? null) });
      const ctx = node.getContext("2d");
      if (!fit || !ctx || tracks.length === 0) return;
      const css = getComputedStyle(node);
      const read = (name: string) => css.getPropertyValue(`--${name}`).trim();
      paintTracks(ctx, placeTracks(tracks, fit.at), (who) => read(`${who}-ink`), read("sheet"));
    };
    draw();
    void document.fonts.ready.then(draw);
    return watchRedraw(box, draw);
  }, [route, tone, world, fine, tracks]);

  return (
    <div ref={host} className="absolute inset-0">
      <canvas ref={canvas} className="block size-full" role="img" aria-label={label} />
    </div>
  );
}
