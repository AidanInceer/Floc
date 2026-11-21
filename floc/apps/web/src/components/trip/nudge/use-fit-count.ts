"use client";

import { useEffect, useLayoutEffect, useState, type RefObject } from "react";

import { fitCount } from "@floc/core/trip/nudge/fit-count";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const MENU_WIDTH = 26;
const GAP = 6;

export function useFitCount(box: RefObject<HTMLElement | null>, ruler: RefObject<HTMLElement | null>, total: number): number {
  const [shown, setShown] = useState(total);

  useIsoLayoutEffect(() => {
    const room = box.current;
    const marks = ruler.current;
    if (!room || !marks) return;
    const measure = () => {
      const widths = [...marks.children].map((c) => c.getBoundingClientRect().width);
      setShown(fitCount(widths, room.clientWidth, GAP, MENU_WIDTH));
    };
    measure();
    const watch = new ResizeObserver(measure);
    watch.observe(room);
    watch.observe(marks);
    return () => watch.disconnect();
  }, [box, ruler, total]);

  return shown;
}
