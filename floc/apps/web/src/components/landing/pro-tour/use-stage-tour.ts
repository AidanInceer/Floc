"use client";

import { useEffect, useRef, useState } from "react";

import { watchFirstView } from "@/lib/landing/scene/scene-start";
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
    if (!node) return;
    return watchFirstView(node, {
      onArm: ({ still }) => {
        if (!still) setMode("armed");
      },
      onStart: ({ still }) => {
        if (still) return;
        setMode("sweep");
        setPlaying(matchMedia("(min-width: 64rem)").matches);
      },
    });
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
