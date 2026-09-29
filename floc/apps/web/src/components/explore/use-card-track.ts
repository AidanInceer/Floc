"use client";

import { useEffect, useRef, useState } from "react";
import { useTrackDrag } from "@/components/system/interaction/use-track-drag";

import { nearestSlide } from "@/lib/landing/carousel";

/** A sideways row of cards that steps one card at a time; a mouse drags it like the landing film. */
export function useCardTrack(count: number) {
  const track = useRef<HTMLOListElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });
  const starts = () => {
    const cards = [...(track.current?.children ?? [])] as HTMLElement[];
    const first = cards[0]?.offsetLeft ?? 0;
    return cards.map((c) => c.offsetLeft - first);
  };

  const here = () => nearestSlide(starts(), track.current?.scrollLeft ?? 0);

  const glide = (card: number) => {
    const el = track.current;
    const left = starts()[Math.max(0, Math.min(card, count - 1))];
    if (!el || left === undefined) return;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left, behavior: still ? "auto" : "smooth" });
  };

  const measure = () => {
    const el = track.current;
    if (!el) return;
    const start = el.scrollLeft <= 1;
    const end = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
    setEdge((was) => (was.start === start && was.end === end ? was : { start, end }));
  };

  useEffect(measure, [count]);

  const { dragging, onPointerDown, onClickCapture } = useTrackDrag({
    track,
    here,
    onRelease: ({ from, direction }) => {
      const near = here();
      glide(near === from ? from + direction : near);
    },
  });
  return {
    track,
    edge,
    dragging,
    step: (direction: 1 | -1) => glide(here() + direction),
    handlers: { onScroll: measure, onPointerDown, onClickCapture },
  };
}
