"use client";

import type { PresetTrip } from "@floc/core/trip/explore/preset-trips";
import { useEffect, useMemo, useRef, useState } from "react";

import { toneOf } from "@/components/explore/listing";
import { tripRoute } from "@/lib/explore/route/trip-route";

import { tripCodes } from "./country";
import { drawOutline } from "./drawing";
import { passCanvas } from "./pass-canvas";
import { useLand } from "./use-land";

const STILL = "(prefers-reduced-motion: reduce)";

type Box = { width: number; height: number };

/** The canvas's own size in CSS px, whole, or null until it has one. */
function useBox(canvas: React.RefObject<HTMLCanvasElement | null>): Box | null {
  const [box, setBox] = useState<Box | null>(null);
  useEffect(() => {
    const node = canvas.current;
    if (!node) return;
    const measure = () => {
      const [width, height] = [Math.round(node.clientWidth), Math.round(node.clientHeight)];
      setBox((was) => (width && height && (was?.width !== width || was.height !== height) ? { width, height } : was));
    };
    const resized = new ResizeObserver(measure);
    resized.observe(node);
    return () => resized.disconnect();
  }, [canvas]);
  return box;
}

/**
 * The pass's map: a listing's route named stop by stop, with how you travel on each leg. The first trip shows still,
 * and each pick after it plays the globe's move, which a click skips.
 * Why: drawn at the canvas's own size, so names are set at the page's 12px and never scaled soft.
 */
export function PassMap({ trip }: { trip: PresetTrip }) {
  const land = useLand("fine");
  const canvas = useRef<HTMLCanvasElement>(null);
  const shown = useRef<string | null>(null);
  const box = useBox(canvas);
  const route = useMemo(() => tripRoute(trip), [trip]);
  const d = useMemo(() => (box ? drawOutline(route.stops, tripCodes(trip.country, route.stops, land), land, box) : null), [route, trip.country, land, box]);

  useEffect(() => {
    const node = canvas.current;
    if (!node || !box || !d?.frame) return;
    const moving = shown.current !== null && shown.current !== trip.id && !matchMedia(STILL).matches;
    shown.current = trip.id;
    const scene = { route, land: d, frame: d.frame, box, tone: toneOf(trip) };
    let stop = passCanvas(node, { ...scene, moving });
    const themed = new MutationObserver(() => {
      stop();
      stop = passCanvas(node, { ...scene, moving: false });
    });
    themed.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      stop();
      themed.disconnect();
    };
  }, [route, d, box, trip]);

  return (
    <canvas
      ref={canvas}
      role="img"
      aria-label={`${route.stops.map((s) => s.place).join(", ")}, ${trip.country}`}
      className="block size-full"
    />
  );
}
