"use client";

import { useState } from "react";

import { paintRange } from "@floc/core/dates/calendar-gestures";
import { dateRange } from "@floc/core/dates/dates";
import { paintDiff, pressTarget, type PaintMark, type PaintMode } from "@floc/core/dates/finding/day-paint";

type Edits = Record<string, PaintMark>;

export function useAvailabilityPaint(mine: string[], liked: string[] = []) {
  const [edits, setEdits] = useState<Edits>({});
  const [mode, setMode] = useState<PaintMode>("free");
  const [drag, setDrag] = useState<{ anchor: string; target: PaintMark; base: Edits } | null>(null);

  const free = new Set(mine);
  const preferred = new Set(liked);
  const stored = (date: string): PaintMark => (preferred.has(date) ? "prefer" : free.has(date) ? "free" : "off");
  const markOf = (date: string): PaintMark => edits[date] ?? stored(date);
  const diff = paintDiff(stored, edits);

  return {
    markOf,
    isFree: (date: string) => markOf(date) !== "off",
    mode,
    setMode,
    diff,
    add: diff.add,
    remove: diff.remove,
    changed: diff.changed,
    dragging: drag !== null,
    withEdits(tallies: Record<string, number>): Record<string, number> {
      const out = { ...tallies };
      for (const [date, delta] of Object.entries(diff.freed)) out[date] = (out[date] ?? 0) + delta;
      return out;
    },
    start(date: string) {
      const target = pressTarget(markOf(date), mode);
      setDrag({ anchor: date, target, base: edits });
      setEdits({ ...edits, [date]: target });
    },
    extend(date: string) {
      if (drag) setEdits(paintRange(drag.base, drag.anchor, date, drag.target, dateRange));
    },
    toggle(date: string) {
      setEdits({ ...edits, [date]: pressTarget(markOf(date), mode) });
    },
    fill(dates: string[]) {
      const next = { ...edits };
      for (const date of dates) if (markOf(date) === "off") next[date] = "free";
      setEdits(next);
    },
    release: () => setDrag(null),
    saved: () => setEdits({}),
  };
}
