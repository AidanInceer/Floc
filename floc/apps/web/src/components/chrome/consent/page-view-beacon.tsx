"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { browserConsent } from "@/lib/consent/consent-cookie";

export function PageViewBeacon() {
  const pathname = usePathname();
  useEffect(() => {
    if (!browserConsent()?.analytics) return;
    navigator.sendBeacon?.("/api/analytics", JSON.stringify({ name: "page.view", path: pathname }));
  }, [pathname]);
  return null;
}
