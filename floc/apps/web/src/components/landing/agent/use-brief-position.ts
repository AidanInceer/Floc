"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";

export function useBriefPosition(stage: RefObject<HTMLElement | null>) {
  const brief = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const host = stage.current;
    const node = brief.current;
    if (!host || !node) return;
    const place = () => {
      node.style.setProperty("--agent-start-x", `${host.clientWidth / 2 - node.offsetLeft - node.offsetWidth / 2}px`);
      node.style.setProperty("--agent-start-y", `${-node.offsetTop}px`);
    };
    place();
    const resized = new ResizeObserver(place);
    resized.observe(host);
    resized.observe(node);
    void document.fonts.ready.then(place);
    return () => resized.disconnect();
  }, [stage]);

  return brief;
}
