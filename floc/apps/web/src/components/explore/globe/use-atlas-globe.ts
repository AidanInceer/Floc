"use client";

import { useEffect, useRef } from "react";

import type { Box } from "@/components/explore/atlas/tag-place";
import { useLand } from "@/components/explore/outline/use-land";
import type { LatLng } from "@/lib/landing/globe/sphere";

import { atlasGlobe } from "./atlas-globe";

type AtlasGlobe = NonNullable<ReturnType<typeof atlasGlobe>>;

const STILL = "(prefers-reduced-motion: reduce)";

/** Runs Explore's globe on a canvas. `clear` is the part of the band the card and the top bar leave open, read on each frame. */
export function useAtlasGlobe(home: LatLng, places: LatLng[], clear: () => Box) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const flags = useRef<HTMLDivElement>(null);
  const stops = useRef<HTMLDivElement>(null);
  const globe = useRef<AtlasGlobe | null>(null);
  const open = useRef(clear);
  const world = useLand("world");
  const fine = useLand("fine");
  const rings = useRef({ world: [] as number[][][], fine: [] as number[][][] });

  useEffect(() => {
    open.current = clear;
  }, [clear]);

  useEffect(() => {
    const node = canvas.current;
    if (!node || !flags.current || !stops.current) return;
    const g = atlasGlobe(node, { home, places, dom: { flags: flags.current, stops: stops.current }, clear: () => open.current() });
    if (!g) return;
    globe.current = g;
    g.setLand(rings.current.world, rings.current.fine);
    g.start(matchMedia(STILL).matches);
    const resized = new ResizeObserver(g.redraw);
    resized.observe(node);
    const themed = new MutationObserver(g.redraw);
    themed.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      resized.disconnect();
      themed.disconnect();
      g.stop();
      globe.current = null;
    };
  }, [home, places]);

  useEffect(() => {
    rings.current = { world: world.map((piece) => piece.ring), fine: fine.map((piece) => piece.ring) };
    globe.current?.setLand(rings.current.world, rings.current.fine);
  }, [world, fine]);

  return { canvas, flags, stops, globe };
}
