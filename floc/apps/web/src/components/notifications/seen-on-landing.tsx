"use client";

import { useEffect } from "react";

export function SeenOnLanding({ act, count }: { act: () => Promise<void>; count: number }) {
  useEffect(() => {
    if (count > 0) void act();
  }, [act, count]);
  return null;
}
