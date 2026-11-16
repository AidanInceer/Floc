"use client";

import type { OverviewRoute } from "@floc/core/trip/overview/route";
import type { TripColor } from "@floc/core/trip/trip-color";
import { useEffect, useRef } from "react";

import { codesAt, ringsIn } from "@/components/explore/outline/land";
import { useLand } from "@/components/explore/outline/use-land";
import { globePainter } from "@/components/globe/paint-globe";
import { CANVAS_ZOOM_EVENT, canvasZoom, unzoomed } from "@/components/globe/pixel-ratio";
import { watchRedraw } from "@/components/globe/watch-redraw";

import { clearArea } from "./clear-area";
import { drawStillRoute, TONE } from "./still-route";

export function OverviewGlobe({
  route,
  tone,
  label,
  quiet = false,
}: {
  route: OverviewRoute;
  tone: TripColor;
  label: string;
  quiet?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const world = useLand("world");
  const fine = useLand("fine");

  useEffect(() => {
    const [box, node] = [host.current, canvas.current];
    const paint = node ? globePainter(node) : null;
    if (!box || !node || !paint) return;
    const codes = new Set([...route.countries, ...codesAt(fine, route.uncoded)]);
    const tint = { rings: ringsIn(world, fine, codes), tone: TONE[tone], alpha: 1 };
    const land = { world: world.map((p) => p.ring), fine: fine.map((p) => p.ring) };
    const draw = () => {
      const card = box.closest("[data-overview-band]")?.querySelector("[data-overview-card]");
      const zoom = canvasZoom(getComputedStyle(node).getPropertyValue("--canvas-zoom"));
      const cardBox = card ? unzoomed(card.getBoundingClientRect(), zoom) : null;
      drawStillRoute(node, paint, { route, land, tint, quiet, clear: clearArea(unzoomed(box.getBoundingClientRect(), zoom), cardBox) });
    };
    draw();
    void document.fonts.ready.then(draw);
    window.addEventListener(CANVAS_ZOOM_EVENT, draw);
    const stop = watchRedraw(box, draw);
    return () => {
      window.removeEventListener(CANVAS_ZOOM_EVENT, draw);
      stop();
    };
  }, [route, tone, world, fine, quiet]);

  return (
    <div ref={host} className="absolute inset-0">
      <canvas ref={canvas} className="block size-full" role="img" aria-label={label} />
    </div>
  );
}
