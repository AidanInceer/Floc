"use client";

import { useEffect, useState, type RefObject } from "react";

import { markLine } from "@/lib/landing/agent/agent-lines";
import type { Box } from "@/lib/landing/leader-line";

type Lines = { width: number; height: number; lines: Record<number, string> };

// Far lines turn this far short of the near column, so the bend sits in the open, not on a card's edge.
const GAP_INSET = 14;

function measure(stage: HTMLElement): Lines {
  const origin = stage.getBoundingClientRect();
  const local = (r: DOMRect): Box => ({
    left: r.left - origin.left,
    right: r.right - origin.left,
    top: r.top - origin.top,
    bottom: r.bottom - origin.top,
    width: r.width,
    height: r.height,
  });
  const ask = stage.querySelector("[data-ask]")?.getBoundingClientRect();
  const near = stage.querySelector("[data-near]")?.getBoundingClientRect();
  const lines: Record<number, string> = {};
  if (!ask || !near) return { width: origin.width, height: origin.height, lines };
  // Why: slots, not cards — a slot holds the card's resting place while the card inside rises in.
  for (const slot of stage.querySelectorAll<HTMLElement>("[data-card]")) {
    const mark = stage.querySelector(`[data-mark="${slot.dataset.card}"]`);
    const rects = mark?.getClientRects();
    const last = rects?.[rects.length - 1];
    if (!last) continue;
    const from = { x: ask.right - origin.left, y: last.top + last.height / 2 - origin.top };
    const far = slot.dataset.far !== undefined;
    lines[Number(slot.dataset.card)] = markLine(from, local(slot.getBoundingClientRect()), far ? near.left - origin.left - GAP_INSET : undefined);
  }
  return { width: origin.width, height: origin.height, lines };
}

/** A line from each marked ask to its card, redrawn as the stage resizes. None while the cards are hidden. */
export function useMarkLines(stage: RefObject<HTMLElement | null>, on: boolean) {
  const [drawn, setDrawn] = useState<Lines>({ width: 0, height: 0, lines: {} });

  useEffect(() => {
    const node = stage.current;
    if (!node || !on) return;
    const draw = () => setDrawn(measure(node));
    const frame = requestAnimationFrame(draw);
    const resized = new ResizeObserver(draw);
    resized.observe(node);
    // Why: the prompt wraps differently once the web font lands, which moves every mark.
    void document.fonts.ready.then(draw);
    return () => {
      cancelAnimationFrame(frame);
      resized.disconnect();
    };
  }, [stage, on]);

  return drawn;
}
