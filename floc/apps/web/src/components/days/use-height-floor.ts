"use client";

import { useEffect, useRef, useState } from "react";

export function useHeightFloor<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [floor, setFloor] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => setFloor((f) => Math.max(f, node.offsetHeight)));
    observer.observe(node);
    const onResize = () => setFloor(node.offsetHeight);
    window.addEventListener("resize", onResize);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return { ref, floor };
}
