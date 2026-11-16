"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const FADE = "1.75rem";

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

function edgeMask({ start, end }: { start: boolean; end: boolean }): string | null {
  if (!start && !end) return null;
  const stops = [
    start ? `transparent 0, black ${FADE}` : "black 0",
    end ? `black calc(100% - ${FADE}), transparent 100%` : "black 100%",
  ];
  return `linear-gradient(to right, ${stops.join(", ")})`;
}
