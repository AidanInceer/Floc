"use client";

import type { PresetTrip } from "@floc/core/trip/explore/preset-trips";
import { useCallback, useEffect, useRef } from "react";

import type { Box } from "@/components/explore/atlas/tag-place";
import { toneOf } from "@/components/explore/listing";
import { tripCodes } from "@/components/explore/outline/country";
import { ringsIn } from "@/components/explore/outline/land";
import { useLand } from "@/components/explore/outline/use-land";
import { watchRedraw } from "@/components/globe/watch-redraw";
import { tripRoute } from "@/lib/explore/route/trip-route";
import type { LatLng } from "@floc/globe/sphere";

import { atlasGlobe } from "./atlas-globe";

type AtlasGlobe = NonNullable<ReturnType<typeof atlasGlobe>>;

const STILL = "(prefers-reduced-motion: reduce)";

/** Runs Explore's globe on a canvas. `clear` is the part of the band the card and the top bar leave open, read on each frame. */
export function useAtlasGlobe(home: LatLng, places: LatLng[], clear: () => Box) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const flags = useRef<HTMLDivElement>(null);
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
    if (!node || !flags.current) return;
    const g = atlasGlobe(node, { home, places, flags: flags.current, clear: () => open.current() });
    if (!g) return;
    globe.current = g;
    g.setLand(rings.current.world, rings.current.fine);
    g.start(matchMedia(STILL).matches);
    const stopRedraw = watchRedraw(node, g.redraw);
    return () => {
      stopRedraw();
      g.stop();
      globe.current = null;
    };
  }, [home, places]);

  useEffect(() => {
    rings.current = { world: world.map((piece) => piece.ring), fine: fine.map((piece) => piece.ring) };
    globe.current?.setLand(rings.current.world, rings.current.fine);
  }, [world, fine]);

  /** Opens a trip's route, with the countries it passes through filled in its region's colour. */
  const openTrip = useCallback(
    (trip: PresetTrip) => {
      const route = tripRoute(trip);
      const rings = ringsIn(world, fine, tripCodes(trip.country, route.stops, fine));
      globe.current?.open(route, { rings, tone: toneOf(trip) });
    },
    [world, fine],
  );

  return { canvas, flags, globe, openTrip };
}
