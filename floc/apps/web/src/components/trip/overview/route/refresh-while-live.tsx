"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { POSITION_EVERY_MS } from "@floc/core/trip/route/route-track";

/** The web shows, never records: it re-reads the page as often as a phone sends a position (#329). */
export function RefreshWhileLive() {
  const router = useRouter();
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, POSITION_EVERY_MS);
    return () => clearInterval(timer);
  }, [router]);
  return null;
}
