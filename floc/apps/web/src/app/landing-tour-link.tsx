"use client";

import { useEffect, useState } from "react";
import type { RefObject } from "react";

type Link = { x1: number; y1: number; x2: number; y2: number };

const inset = 28;

function measure(root: HTMLElement, from: HTMLElement, to: HTMLElement): Link {
  const base = root.getBoundingClientRect();
  const a = from.getBoundingClientRect();
  const b = to.getBoundingClientRect();
  const y1 = a.top + a.height / 2 - base.top;
  const top = b.top - base.top + inset;
  const bottom = b.bottom - base.top - inset;
  return { x1: a.right - base.left, y1, x2: b.left - base.left, y2: Math.min(Math.max(y1, top), bottom) };
}

/** Why: the chat is sticky, so the tile and the chat drift apart on scroll — the line bends to keep them joined. */
export function TourLink({
  root,
  from,
  to,
  pick,
}: {
  root: RefObject<HTMLElement | null>;
  from: RefObject<HTMLElement | null>;
  to: RefObject<HTMLElement | null>;
  pick: number;
}) {
  const [link, setLink] = useState<Link | null>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (root.current && from.current && to.current) setLink(measure(root.current, from.current, to.current));
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [root, from, to, pick]);

  if (!link) return null;
  const mid = (link.x1 + link.x2) / 2;
  return (
    <svg className="pointer-events-none absolute inset-0 hidden size-full overflow-visible text-ink-faint md:block" aria-hidden>
      <path
        d={`M${link.x1} ${link.y1} H${mid} V${link.y2} H${link.x2}`}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeDasharray="4 4"
        strokeLinejoin="round"
      />
    </svg>
  );
}
