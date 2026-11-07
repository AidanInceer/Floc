"use client";

import { useEffect, useRef } from "react";

import { arrive } from "@/lib/trip-open/trip-open";
import "@/lib/trip-open/trip-open.css";

/** Sits in the Overview's hero: when the page was opened from a My trips bar, the curtain lands on this card. */
export function TripArrival({ href }: { href: string }) {
  const mark = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const card = mark.current?.closest("section");
    if (card) arrive(card, href);
  }, [href]);
  return <span ref={mark} hidden />;
}
