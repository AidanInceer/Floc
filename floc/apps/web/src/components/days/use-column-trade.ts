"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from "react";

import { slotIndices, tradeFor, tradeTracks, type Trade } from "@/lib/days/column-trade";
import "./days-trade.css";

const MOVE_MS = 650;

type Playing = { trade: Trade; tracks: string; after: string; moving: boolean };

export function useColumnTrade(focusIndex: number, gridRef: RefObject<HTMLDivElement | null>) {
  const [playing, setPlaying] = useState<Playing | null>(null);
  const last = useRef(focusIndex);

  useLayoutEffect(() => {
    const from = last.current;
    last.current = focusIndex;
    const trade = tradeFor(from, focusIndex);
    const focus = gridRef.current?.children[2];
    if (!trade || !focus || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPlaying(null);
      return;
    }
    const { before, after } = tradeTracks(trade, Math.round(focus.getBoundingClientRect().width));
    setPlaying({ trade, tracks: before, after, moving: false });
  }, [focusIndex, gridRef]);

  const moving = playing?.moving ?? false;
  const started = playing !== null;
  useEffect(() => {
    if (!started) return;
    if (!moving) {
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
