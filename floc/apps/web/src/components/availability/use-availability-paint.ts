"use client";

import { useState } from "react";

import { paintRange } from "@floc/core/dates/calendar-gestures";
import { dateRange } from "@floc/core/dates/dates";

/**
 * Your own free days while you paint them. Only touched dates are held, so untouched days
 * fall through to the server's copy and a concurrent edit isn't reverted. Nothing writes
 * until save: one action per session, not one round trip per day.
 */
export function useAvailabilityPaint(mine: string[]) {
  const [edits, setEdits] = useState<Record<string, boolean>>({});
  // The drag recomputes the whole span from `base` each move, not cell by cell:
  // a fast drag skips cells and would leave holes.
  const [drag, setDrag] = useState<{ anchor: string; target: boolean; base: Record<string, boolean> } | null>(null);

  const stored = new Set(mine);
  const isFree = (date: string) => edits[date] ?? stored.has(date);
  const changed = Object.entries(edits).filter(([date, free]) => free !== stored.has(date));

  return {
    isFree,
    changed: changed.length,
    add: changed.filter(([, free]) => free).map(([date]) => date),
    remove: changed.filter(([, free]) => !free).map(([date]) => date),
    dragging: drag !== null,
    /** The group's counts with your unsaved marks in, so a day takes its colour as you paint it. */
    withEdits(tallies: Record<string, number>): Record<string, number> {
      const out = { ...tallies };
      for (const [date, free] of changed) out[date] = (out[date] ?? 0) + (free ? 1 : -1);
      return out;
    },
    start(date: string) {
      const target = !isFree(date);
      setDrag({ anchor: date, target, base: edits });
      setEdits({ ...edits, [date]: target });
    },
    extend(date: string) {
      if (drag) setEdits(paintRange(drag.base, drag.anchor, date, drag.target, dateRange));
    },
    toggle(date: string) {
      setEdits({ ...edits, [date]: !isFree(date) });
    },
    release: () => setDrag(null),
    saved: () => setEdits({}),
  };
}
