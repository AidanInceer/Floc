"use client";

import { useEffect, useRef, useState } from "react";

import type { LatLng } from "@/lib/landing/globe/sphere";
import { watchFirstView } from "@/lib/landing/scene/scene-start";

import { spinGlobe } from "./spin-globe";

type Outline = { features: { geometry: { type: string; coordinates: number[][][] | number[][][][] } }[] };

const outerRings = (geo: Outline) =>
  geo.features.flatMap(({ geometry: g }) => {
    if (g.type === "Polygon") return [(g.coordinates as number[][][])[0]!];
    return g.type === "MultiPolygon" ? (g.coordinates as number[][][][]).map((poly) => poly[0]!) : [];
  });

/** Runs the globe on a canvas. `lit` is the place it is on, or passing while it spins. */
export function useSpinGlobe(home: LatLng, places: LatLng[]) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const globe = useRef<ReturnType<typeof spinGlobe>>(null);
  const [lit, setLit] = useState(0);

  useEffect(() => {
    const node = canvas.current;
    const g = node && spinGlobe(node, { home, places, onLight: setLit });
    if (!node || !g) return;
    globe.current = g;
    let live = true;
    const stopWatch = watchFirstView(node, { onStart: ({ still }) => g.start(still) });
    // Why: the land outline is 175 kB, so it loads only when the band is near the screen.
    const near = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        near.disconnect();
        fetch("/countries-110m.geojson")
          .then((r) => r.json())
          .then((geo: Outline) => live && g.setLand(outerRings(geo)))
          .catch(() => {});
      },
      { rootMargin: "800px 0px" },
    );
    near.observe(node);
    const resized = new ResizeObserver(g.redraw);
    resized.observe(node);
    const themed = new MutationObserver(g.redraw);
    themed.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      live = false;
      stopWatch();
      near.disconnect();
      resized.disconnect();
      themed.disconnect();
      g.stop();
      globe.current = null;
    };
  }, [home, places]);

  return { canvas, lit, show: (i: number) => globe.current?.show(i), spin: () => globe.current?.spin() };
}
