"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A front-door scene's one clock (ADR-019): it starts the first time the stage
 * is well on screen, then `t` steps to each beat as it passes and rests on the
 * last. Before it starts `t` is -1; reduced motion jumps straight to the end.
 */
export function useAgentClock<T extends Element>(beats: readonly number[]) {
  const ref = useRef<T>(null);
  const [t, setT] = useState(-1);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let frame = 0;
    const play = () => {
      const start = performance.now();
      let passed = 0;
      const tick = (now: number) => {
        const before = passed;
        while (passed < beats.length && beats[passed]! <= now - start) passed++;
        if (passed !== before) setT(beats[passed - 1]!);
        if (passed < beats.length) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };
    const seen = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        seen.disconnect();
        if (matchMedia("(prefers-reduced-motion: reduce)").matches) setT(Infinity);
        else play();
      },
      // Why: a threshold never fires on a stage taller than the phone's screen; a margin does.
      { rootMargin: "0px 0px -35% 0px" },
    );
    seen.observe(node);
    return () => {
      seen.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [beats]);

  return { ref, t };
}
