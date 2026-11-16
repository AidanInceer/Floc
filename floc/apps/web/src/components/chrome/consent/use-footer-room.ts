"use client";

import { useCallback, useRef } from "react";

const ROOM = "--consent-room";

export function useFooterRoom() {
  const observer = useRef<ResizeObserver | null>(null);

  return useCallback((node: HTMLElement | null) => {
    observer.current?.disconnect();
    observer.current = null;
    if (!node) {
      document.body.style.removeProperty(ROOM);
      return;
    }
    observer.current = new ResizeObserver(() => document.body.style.setProperty(ROOM, `${node.offsetHeight}px`));
    observer.current.observe(node);
  }, []);
}
