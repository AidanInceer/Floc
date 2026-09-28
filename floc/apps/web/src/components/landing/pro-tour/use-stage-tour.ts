"use client";

import { useEffect, useRef, useState } from "react";

import { nextStage } from "@/lib/landing/pro-tour";

import type { WipeMode } from "./use-wipe";

const BEAT_MS = 6000;

/**
 * Walks the stages once when the tour is first on screen, then rests (ADR-019).
 * Each stage sweeps from free to Pro. A pick or a drag stops the walk. Not on a
 * narrow screen: there the list sits under the page, so a timer would swap it out mid-read.
 */
export function useStageTour(count: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(0);
  const [mode, setMode] = useState<WipeMode>("rest");
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setMode("armed");
    const wide = matchMedia("(min-width: 64rem)").matches;
    const seen = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        seen.disconnect();
        setMode("sweep");
        setPlaying(wide);
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

  const hold = () => setPlaying(false);
  const pick = (i: number) => {
    hold();
    setAt(i);
  };

  return { ref, at, mode, pick, hold };
}
