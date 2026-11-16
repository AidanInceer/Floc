"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

import { loadLand } from "@/components/explore/outline/use-land";
import { watchRedraw } from "@/components/globe/watch-redraw";
import type { LatLng } from "@floc/globe/sphere";
import { watchFirstView } from "@/lib/landing/scene/scene-start";

import { spinGlobe } from "./spin-globe";

export type Globe = NonNullable<ReturnType<typeof spinGlobe>>;

export type GlobeEvents = { onSettle?: (index: number) => void; onWay?: (state: "open" | "shut") => void };

export function useSpinGlobe(home: LatLng, places: LatLng[], events: RefObject<GlobeEvents>) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const globe = useRef<Globe | null>(null);
  const [lit, setLit] = useState(0);

  useEffect(() => {
    const node = canvas.current;
    const g =
      node &&
      spinGlobe(node, {
        home,
        places,
        onLight: setLit,
        onSettle: (i) => events.current.onSettle?.(i),
        onWay: (state) => events.current.onWay?.(state),
      });
    if (!node || !g) return;
    globe.current = g;
    let live = true;
    const stopWatch = watchFirstView(node, { onStart: ({ still }) => g.start(still) });
    const near = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        near.disconnect();
        void loadLand("world").then((pieces) => {
          if (live && pieces.length > 0) g.setLand(pieces);
        });
      },
      { rootMargin: "800px 0px" },
    );
    near.observe(node);
    const stopRedraw = watchRedraw(node, g.redraw);
    return () => {
      live = false;
      stopWatch();
      near.disconnect();
      stopRedraw();
      g.stop();
      globe.current = null;
    };
  }, [home, places, events]);

  return { canvas, lit, globe };
}
