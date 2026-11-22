"use client";

import { useCallback, useEffect, useMemo, useState, type FocusEvent, type PointerEvent, type RefObject } from "react";

import { watchStill } from "@/lib/motion/still";

import type { Globe } from "../globe/use-spin-globe";

export function useTourHold(globe: RefObject<Globe | null>) {
  const [paused, setPaused] = useState(false);
  const hold = useCallback((why: string, on: boolean) => globe.current?.holdTour(why, on), [globe]);

  useEffect(() => {
    hold("paused", paused);
  }, [hold, paused]);

  useEffect(() => watchStill(() => hold("focus", false)), [hold]);

  const watch = useMemo(
    () => ({
      onPointerEnter: (e: PointerEvent) => {
        if (e.pointerType === "mouse") hold("pointer", true);
      },
      onPointerLeave: () => hold("pointer", false),
      onFocus: (e: FocusEvent) => {
        if (e.target.matches(":focus-visible")) hold("focus", true);
      },
      onBlur: () => hold("focus", false),
    }),
    [hold],
  );

  const flipPaused = () => {
    hold("pointer", false);
    hold("focus", false);
    setPaused(!paused);
  };

  return { paused, flipPaused, watch };
}
