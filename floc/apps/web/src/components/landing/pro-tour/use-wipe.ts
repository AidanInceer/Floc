"use client";

import { useLayoutEffect, useRef, useState } from "react";

import { sweepAt } from "@/lib/landing/pro-wipe";

/** `rest` sits on Pro, `armed` waits on the free page, `sweep` crosses from free to Pro once. */
export type WipeMode = "rest" | "armed" | "sweep";

export function useWipe(mode: WipeMode) {
  const [x, setX] = useState(1);
  const frame = useRef(0);

  // Layout, not a plain effect: the free page must be up before the first paint, or Pro flashes first.
  useLayoutEffect(() => {
    if (mode === "rest") return;
    setX(0);
    if (mode === "armed") return;
    const start = performance.now();
    const tick = (now: number) => {
      const next = sweepAt(now - start);
      setX(next);
      if (next < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [mode]);

  const set = (next: number) => {
    cancelAnimationFrame(frame.current);
    setX(next);
  };

  return { x, set };
}
