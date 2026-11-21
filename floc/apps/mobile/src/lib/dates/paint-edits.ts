import { paintRange } from "@floc/core/dates/calendar-gestures";
import { dateRange } from "@floc/core/dates/dates";
import { pressTarget, type PaintMark, type PaintMode } from "@floc/core/dates/finding/day-paint";

export type Edits = Record<string, PaintMark>;

export type Drag = { anchor: string; target: PaintMark; base: Edits };

export function beginDrag(edits: Edits, anchor: string, markOf: (date: string) => PaintMark, mode: PaintMode): { drag: Drag; edits: Edits } {
  const target = pressTarget(markOf(anchor), mode);
  return { drag: { anchor, target, base: edits }, edits: { ...edits, [anchor]: target } };
}

export function extendDrag(drag: Drag, to: string): Edits {
  return paintRange(drag.base, drag.anchor, to, drag.target, dateRange);
}

export function fillDays(edits: Edits, markOf: (date: string) => PaintMark, dates: string[]): Edits {
  const next = { ...edits };
  for (const date of dates) if (markOf(date) === "off") next[date] = "free";
  return next;
}
