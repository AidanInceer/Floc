"use client";

import { useEffect, useRef, useState } from "react";

import { watchFirstView } from "@/lib/landing/scene/scene-start";

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
