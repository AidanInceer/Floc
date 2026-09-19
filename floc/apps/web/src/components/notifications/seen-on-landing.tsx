"use client";

import { useEffect } from "react";

/**
 * Why: the bell counts unseen, and arriving here is the seeing. The page can't
 * write on render, so the client says so once the page is on screen (#403).
 */
export function SeenOnLanding({ act, count }: { act: () => Promise<void>; count: number }) {
  useEffect(() => {
    if (count > 0) void act();
  }, [act, count]);
  return null;
}
