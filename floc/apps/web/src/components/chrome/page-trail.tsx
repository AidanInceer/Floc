"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { notePage } from "@/lib/chrome/page-trail";

export function PageTrail() {
  const pathname = usePathname();
  useEffect(() => notePage(pathname), [pathname]);
  return null;
}
