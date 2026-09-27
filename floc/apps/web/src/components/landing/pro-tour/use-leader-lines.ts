"use client";

import { useEffect, useState, type RefObject } from "react";

import { leaderLine, type Box } from "@/lib/landing/leader-line";

type Leader = { key: string; d: string; x: number; y: number; soon: boolean };
type Drawn = { width: number; height: number; lines: Leader[] };

// Notes rise in over half a second; measuring before they land draws the lines short.
const SETTLE_MS = 650;

function measure(stage: HTMLElement): Drawn {
  const box = stage.getBoundingClientRect();
  // The svg sits in the stage, so every box is moved to the stage's own corner.
  const local = (el: Element): Box => {
    const r = el.getBoundingClientRect();
    return { left: r.left - box.left, right: r.right - box.left, top: r.top - box.top, bottom: r.bottom - box.top, width: r.width, height: r.height };
  };
  const device = stage.querySelector<HTMLElement>("[data-device]");
  const size = { width: box.width, height: box.height };
  if (!device?.offsetWidth) return { ...size, lines: [] };
  const lines = [...stage.querySelectorAll<HTMLElement>("[data-note]")].flatMap((note) => {
    const key = note.dataset.note ?? "";
    const row = device.querySelector(`[data-row="${key}"]`);
    if (!row) return [];
    const { d, end } = leaderLine(local(note), local(device), local(row));
    return [{ key, d, x: end.x, y: end.y, soon: "soon" in note.dataset }];
  });
  return { ...size, lines };
}

/** Lines from each note to its row. None while the web page is hidden, since the badges carry the link then. */
export function useLeaderLines(stage: RefObject<HTMLElement | null>, redrawOn: unknown) {
  const [drawn, setDrawn] = useState<Drawn>({ width: 0, height: 0, lines: [] });

  useEffect(() => {
    const node = stage.current;
    if (!node) return;
    const draw = () => setDrawn(measure(node));
    const frame = requestAnimationFrame(draw);
    const settled = window.setTimeout(draw, SETTLE_MS);
    const resized = new ResizeObserver(draw);
    resized.observe(node);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(settled);
      resized.disconnect();
    };
  }, [stage, redrawOn]);

  return drawn;
}
