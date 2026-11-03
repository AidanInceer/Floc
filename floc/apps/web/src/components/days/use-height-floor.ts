"use client";

/**
 * Why: a day with fewer events folds to a shorter calendar. If the page gets
 * shorter while you are scrolled down, the browser pulls the page up and the
 * calendar jumps. The floor only rises, so the page below the calendar keeps
 * its height and the calendar stays where it was.
 */
import { useEffect, useRef, useState } from "react";

export function useHeightFloor<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [floor, setFloor] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => setFloor((f) => Math.max(f, node.offsetHeight)));
    observer.observe(node);
    // A new window height changes the calendar's own cap (70vh), so the floor starts again.
    const onResize = () => setFloor(node.offsetHeight);
    window.addEventListener("resize", onResize);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return { ref, floor };
}
