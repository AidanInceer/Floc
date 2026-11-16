"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

import type { BorrowCard as Card } from "@/lib/landing/borrow";

import type { Globe } from "../globe/use-spin-globe";

type Way = { card: number; on: boolean; step: number };

export function useBorrowWay(globe: RefObject<Globe | null>, cards: Card[]) {
  const stage = useRef<HTMLDivElement>(null);
  const back = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const [way, setWay] = useState<Way | null>(null);
  const card = way?.card ?? null;

  const leave = useCallback(() => {
    setWay((w) => w && { ...w, on: false });
    globe.current?.close();
  }, [globe]);

  useEffect(() => {
    if (card === null) return opener.current?.focus({ preventScroll: true });
    if (stage.current) globe.current?.open(card, cards[card]!, { stage: stage.current });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && leave();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [card, cards, globe, leave]);

  return {
    way,
    stage,
    back,
    leave,
    enter(index: number, from: HTMLElement) {
      if (way) return;
      opener.current = from;
      setWay({ card: index, on: false, step: 0 });
    },
    go(k: number) {
      if (!way) return;
      const step = Math.min(cards[way.card]!.stops.length - 1, Math.max(0, k));
      setWay({ ...way, step });
      globe.current?.goTo(step);
    },
    changed: useCallback((state: "open" | "shut") => {
      if (state === "shut") return setWay(null);
      setWay((w) => w && { ...w, on: true });
      back.current?.focus({ preventScroll: true });
    }, []),
  };
}
