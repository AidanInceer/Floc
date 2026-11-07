"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { openTrip } from "@/lib/trip-open/trip-open";
import "@/lib/trip-open/trip-open.css";

/** The link a My trips bar opens from: a plain click plays the open (trip-open.ts); a new tab or window is left alone. */
export function TripOpenLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  const router = useRouter();
  return (
    <Link
      href={href}
      className={className}
      onPointerEnter={() => router.prefetch(href)}
      onClick={(e) => {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        openTrip(href, (to) => router.push(to));
      }}
    >
      {children}
    </Link>
  );
}
