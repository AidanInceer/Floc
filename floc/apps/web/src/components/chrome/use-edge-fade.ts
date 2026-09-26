"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";

// useLayoutEffect warns during SSR; on the server there is nothing to measure.
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const FADE = "1.75rem";

/**
 * A scrolling row with no visible scrollbar looks like a row that fits. Fade
 * whichever end still has links behind it — the one affordance that says
 * "there's more this way" without printing an instruction (ticket 209).
 */
export function useEdgeFade<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const slack = el.scrollWidth - el.clientWidth;
    setEdges({ start: el.scrollLeft > 1, end: slack > 1 && el.scrollLeft < slack - 1 });
  }, []);

  useIsoLayoutEffect(measure, [measure]);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure]);

  const mask = edgeMask(edges);
  const style: CSSProperties | undefined = mask ? { maskImage: mask, WebkitMaskImage: mask } : undefined;
  return { ref, onScroll: measure, style };
}

// `black`/`transparent` are mask channels, not paint — a mask reads only the alpha.
function edgeMask({ start, end }: { start: boolean; end: boolean }): string | null {
  if (!start && !end) return null;
  const stops = [
    start ? `transparent 0, black ${FADE}` : "black 0",
    end ? `black calc(100% - ${FADE}), transparent 100%` : "black 100%",
  ];
  return `linear-gradient(to right, ${stops.join(", ")})`;
}
