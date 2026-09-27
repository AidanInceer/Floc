"use client";

import { useEffect, useRef, useState } from "react";
import type { MouseEvent, PointerEvent } from "react";

import { nearestSlide } from "@/lib/landing/carousel";

/** A sideways row of cards that steps one card at a time; a mouse drags it like the landing film. */
export function useCardTrack(count: number) {
  const track = useRef<HTMLOListElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });
  const drag = useRef<{ x: number; left: number; from: number } | null>(null);
  // A drag ends in a click on the card it let go over; that click must not pick it.
  const dragged = useRef(false);
  const [dragging, setDragging] = useState(false);

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

  const onPointerDown = (e: PointerEvent<HTMLOListElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0 || !track.current) return;
    drag.current = { x: e.clientX, left: track.current.scrollLeft, from: here() };
    dragged.current = false;
    setDragging(true);
  };

  useEffect(() => {
    if (!dragging) return;
    const move = (e: globalThis.PointerEvent) => {
      if (drag.current && track.current) track.current.scrollLeft = drag.current.left - (e.clientX - drag.current.x);
    };
    const up = (e: globalThis.PointerEvent) => {
      const dx = drag.current ? e.clientX - drag.current.x : 0;
      const from = drag.current?.from ?? 0;
      drag.current = null;
      dragged.current = Math.abs(dx) > 5;
      setDragging(false);
      const near = here();
      glide(near === from && Math.abs(dx) > 60 ? from + (dx < 0 ? 1 : -1) : near);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up, { once: true });
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- here and glide read only refs
  }, [dragging]);

  const onClickCapture = (e: MouseEvent) => {
    if (!dragged.current) return;
    e.preventDefault();
    e.stopPropagation();
    dragged.current = false;
  };

  return {
    track,
    edge,
    dragging,
    step: (direction: 1 | -1) => glide(here() + direction),
    handlers: { onScroll: measure, onPointerDown, onClickCapture },
  };
}
