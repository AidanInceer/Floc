"use client";

import { useEffect, useState } from "react";

import { easeInOut } from "@/lib/landing/journey";

const JOURNEY_MS = 2600;
const DELAY_MS = 200;

/** Progress 0 → 1 across one trip while `playing`; a card not playing sits finished at 1. */
export function useJourney(playing: boolean): number {
  const [progress, setProgress] = useState(playing ? 0 : 1);
  const [wasPlaying, setWasPlaying] = useState(playing);
  if (playing !== wasPlaying) {
    setWasPlaying(playing);
    if (playing) setProgress(0);
  }

  useEffect(() => {
    if (!playing) return;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now() + DELAY_MS;
    let frame = requestAnimationFrame(function tick(now) {
      const x = still ? 1 : Math.min(1, Math.max(0, (now - start) / JOURNEY_MS));
      setProgress(easeInOut(x));
      if (x < 1) frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  return playing ? progress : 1;
}
