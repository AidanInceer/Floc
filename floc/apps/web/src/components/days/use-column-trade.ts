"use client";

/**
 * On a step of one day, the calendar's columns trade places (ADR-051): four
 * slots draw for 0.45s while the grid's day tracks move from the old shape to
 * the new. Reduced motion, or a jump of more than a day, changes plainly.
 */
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from "react";

import { slotIndices, tradeFor, tradeTracks, type Trade } from "@/lib/days/column-trade";
import "./days-trade.css";

const MOVE_MS = 450;

type Playing = { trade: Trade; tracks: string; after: string; moving: boolean };

export function useColumnTrade(focusIndex: number, gridRef: RefObject<HTMLDivElement | null>) {
  const [playing, setPlaying] = useState<Playing | null>(null);
  const last = useRef(focusIndex);

  // Before paint, so the plain new day never shows for a frame ahead of the move.
  useLayoutEffect(() => {
    const from = last.current;
    last.current = focusIndex;
    const trade = tradeFor(from, focusIndex);
    const focus = gridRef.current?.children[2];
    if (!trade || !focus || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPlaying(null);
      return;
    }
    const { before, after } = tradeTracks(trade.dir, Math.round(focus.getBoundingClientRect().width));
    setPlaying({ trade, tracks: before, after, moving: false });
  }, [focusIndex, gridRef]);

  const moving = playing?.moving ?? false;
  const started = playing !== null;
  useEffect(() => {
    if (!started) return;
    if (!moving) {
      // Why: reading layout settles the old shape as the start of the move; no frame wait, which a hidden tab never gives.
      void gridRef.current?.offsetWidth;
      setPlaying((p) => (p ? { ...p, tracks: p.after, moving: true } : p));
      return;
    }
    const done = setTimeout(() => setPlaying(null), MOVE_MS);
    return () => clearTimeout(done);
  }, [started, moving, gridRef]);

  return {
    indices: slotIndices(focusIndex, playing?.trade ?? null),
    phase: playing ? (playing.moving ? "moving" : "ready") : undefined,
    style: (playing ? { "--days-tracks": playing.tracks } : undefined) as CSSProperties | undefined,
  };
}
