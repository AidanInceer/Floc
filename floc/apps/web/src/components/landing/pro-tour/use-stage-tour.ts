"use client";

import { useEffect, useRef, useState } from "react";

import { nextStage } from "@/lib/landing/pro-tour";

const BEAT_MS = 5200;

/**
 * Walks the stages once when the tour is first on screen, then rests (ADR-019).
 * A pick stops it. Not on a narrow screen: there the stage is taller than the
 * screen, so a timer would swap it out mid-read.
 */
export function useStageTour(count: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const node = ref.current;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!node || still || !matchMedia("(min-width: 64rem)").matches) return;
    const seen = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        seen.disconnect();
        setPlaying(true);
      },
      { threshold: 0.35 },
    );
    seen.observe(node);
    return () => seen.disconnect();
  }, []);

  useEffect(() => {
    const next = nextStage(at, count);
    if (!playing || next === null) return;
    const timer = window.setTimeout(() => setAt(next), BEAT_MS);
    return () => clearTimeout(timer);
  }, [playing, at, count]);

  const pick = (i: number) => {
    setPlaying(false);
    setAt(i);
  };

  return { ref, at, pick };
}
