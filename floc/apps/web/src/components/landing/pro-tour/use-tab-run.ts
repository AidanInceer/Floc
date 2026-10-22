"use client";

import { useEffect, useRef, useState } from "react";

import { PILE_AT, PRO_TABS, closeAt, landAt } from "@/lib/landing/pro-tour";
import { watchFirstView } from "@/lib/landing/scene/scene-start";

import { dropGhosts, flyTab } from "./fly-tab";

/** `closed` tabs have left the strip, `done` jobs show on the ticket, `piled` folds the closed tabs beside Floc. */
type TabRun = { closed: number; done: number; piled: boolean };

const REST: TabRun = { closed: PRO_TABS.length, done: PRO_TABS.length, piled: true };
const START: TabRun = { closed: 0, done: 0, piled: false };
const WIDE = "(min-width: 48rem)";

/**
 * Closes the planning tabs once, the first time the band is on screen, then rests (ADR-019).
 * Not on a phone: there the ticket runs far below the strip, so the tabs would fly off screen.
 */
export function useTabRun() {
  const ref = useRef<HTMLDivElement>(null);
  const [run, setRun] = useState(REST);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const timers: number[] = [];
    const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));
    const rest = () => {
      timers.forEach(clearTimeout);
      dropGhosts();
      setRun(REST);
    };
    const stop = watchFirstView(node, {
      onArm: ({ still }) => {
        if (!still && matchMedia(WIDE).matches) setRun(START);
      },
      onStart: ({ still }) => {
        if (still || !matchMedia(WIDE).matches) return rest();
        PRO_TABS.forEach((key, i) => {
          at(closeAt(i), () => {
            flyTab(node, key);
            setRun((r) => ({ ...r, closed: i + 1 }));
          });
          at(landAt(i), () => setRun((r) => ({ ...r, done: i + 1 })));
        });
        at(PILE_AT, () => setRun(REST));
      },
      onStill: rest,
    });
    return () => {
      stop();
      timers.forEach(clearTimeout);
      dropGhosts();
    };
  }, []);

  return { ref, run };
}
