"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

import { arrange, around, HAND, spinPick, stopTimes } from "@/lib/landing/globe/hand";
import { reelTick } from "@/lib/landing/globe/reel";
import type { LatLng } from "@/lib/landing/globe/sphere";

import type { Globe } from "../globe/use-spin-globe";

/** What one tile shows. `tick` is a trip rolling past, `land` the trip a spin stops on, `in` a trip the globe was turned to. */
export type Face = { card: number; kind: "rest" | "tick" | "land" | "in"; key: number };
type Change = [slot: number, card: number, kind: Face["kind"]];

const STILL = "(prefers-reduced-motion: reduce)";
// Why: Sonar rates Math.random as a security issue, even for a game of chance.
const pick = (n: number) => crypto.getRandomValues(new Uint32Array(1))[0]! % n;

/**
 * The six tiles: the trips nearest the place the globe is on. A spin rolls them and stops them
 * one by one, the pick last; turning the globe by hand brings up the trips around where it rests.
 */
export function useBorrowHand(places: LatLng[], globe: RefObject<Globe | null>) {
  const [faces, setFaces] = useState<Face[]>(() => places.slice(0, HAND).map((_, i) => ({ card: i, kind: "rest", key: i })));
  const live = useRef({ hand: faces.map((f) => f.card), frame: 0, keys: faces.length });

  const swap = useCallback((changes: Change[]) => {
    if (!changes.length) return;
    const keyed = changes.map(([slot, card, kind]) => ({ slot, face: { card, kind, key: live.current.keys++ } }));
    setFaces((prev) => prev.map((face, slot) => keyed.find((c) => c.slot === slot)?.face ?? face));
  }, []);

  useEffect(() => {
    const l = live.current;
    globe.current?.setHand(l.hand);
    return () => cancelAnimationFrame(l.frame);
  }, [globe, places]);

  const spin = useCallback(
    (at: number) => {
      const [g, l] = [globe.current, live.current];
      if (!g || l.frame) return;
      const win = spinPick(places.length, l.hand, at, pick);
      const next = arrange(l.hand, around(places[win]!, places), pick);
      const stops = stopTimes(l.hand, next, win, pick);
      l.hand = next;
      g.setHand(next);
      g.spin(win);
      if (matchMedia(STILL).matches) return swap(next.flatMap((card, slot) => (stops[slot] === null ? [] : [[slot, card, "rest"] as Change])));
      const t0 = performance.now();
      const ticks = stops.map(() => 0);
      const roll = () => {
        const elapsed = performance.now() - t0;
        const changes: Change[] = [];
        let passing: number[] | null = null;
        stops.forEach((stopAt, slot) => {
          if (stopAt === null) return;
          if (elapsed >= stopAt) {
            stops[slot] = null;
            return changes.push([slot, next[slot]!, "land"]);
          }
          const tick = reelTick(slot, stopAt, elapsed);
          if (tick === ticks[slot]) return;
          ticks[slot] = tick;
          passing ??= around(g.passing(), places);
          changes.push([slot, passing[slot]!, "tick"]);
        });
        swap(changes);
        l.frame = stops.some((stopAt) => stopAt !== null) ? requestAnimationFrame(roll) : 0;
      };
      l.frame = requestAnimationFrame(roll);
    },
    [globe, places, swap],
  );

  const settle = useCallback(
    (at: number) => {
      const l = live.current;
      // Why: a globe grabbed mid-spin ends the roll, so every tile takes its new trip at once.
      const rolling = l.frame !== 0;
      cancelAnimationFrame(l.frame);
      l.frame = 0;
      const next = arrange(l.hand, around(places[at]!, places), pick);
      swap(next.flatMap((card, slot) => (!rolling && card === l.hand[slot] ? [] : [[slot, card, "in"] as Change])));
      l.hand = next;
      globe.current?.setHand(next);
    },
    [globe, places, swap],
  );

  return { faces, spin, settle };
}
