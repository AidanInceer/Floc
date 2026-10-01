"use client";

import { useEffect, useRef, useState } from "react";

import { watchFirstView } from "@/lib/landing/scene/scene-start";

/**
 * A front-door scene (ADR-019): the beats play once, the first time the stage is
 * on screen, then it rests on the last one. Reduced motion goes straight there.
 * `step` counts the beats played so far.
 */
export function useScene<T extends Element>(beatsMs: readonly number[]) {
  const ref = useRef<T>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const timers: number[] = [];
    const stop = watchFirstView(node, {
      onStart: ({ still }) => {
        if (still) setStep(beatsMs.length);
        else beatsMs.forEach((ms, i) => timers.push(window.setTimeout(() => setStep(i + 1), ms)));
      },
    });
    return () => {
      stop();
      timers.forEach(clearTimeout);
    };
  }, [beatsMs]);

  return { ref, step };
}
