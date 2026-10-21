"use client";

import type { OverviewRoute } from "@floc/core/trip/overview/route";
import type { TripColor } from "@floc/core/trip/trip-color";
import { useEffect, useRef } from "react";

import { codesAt } from "@/components/explore/outline/land";
import { useLand } from "@/components/explore/outline/use-land";
import { globePainter } from "@/components/landing/globe/paint-globe";

import { clearArea } from "./clear-area";
import { drawStillRoute, TONE } from "./still-route";

/**
 * The trip's route on Explore's tile-free globe, still: no fly-in on a page the group opens again and again.
 * It is drawn from the days each time the page loads, so a change on Days is simply there.
 */
export function OverviewGlobe({ route, tone, label }: { route: OverviewRoute; tone: TripColor; label: string }) {
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
    const tint = { rings: new Set([...world, ...fine].filter((p) => codes.has(p.code)).map((p) => p.ring)), tone: TONE[tone], alpha: 1 };
    const land = { world: world.map((p) => p.ring), fine: fine.map((p) => p.ring) };
    const draw = () => {
      const card = box.closest("[data-overview-band]")?.querySelector("[data-overview-card]");
      drawStillRoute(node, paint, { route, land, tint, clear: clearArea(box.getBoundingClientRect(), card?.getBoundingClientRect() ?? null) });
    };
    draw();
    void document.fonts.ready.then(draw);
    const resized = new ResizeObserver(draw);
    resized.observe(box);
    const themed = new MutationObserver(draw);
    themed.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      resized.disconnect();
      themed.disconnect();
    };
  }, [route, tone, world, fine]);

  return (
    <div ref={host} className="absolute inset-0">
      <canvas ref={canvas} className="block size-full" role="img" aria-label={label} />
    </div>
  );
}
