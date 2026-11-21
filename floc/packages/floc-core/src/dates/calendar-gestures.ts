import {
  NUDGE_MINUTES,
  moveSpan,
  resizeSpan,
  toHhmm,
} from "./calendar";

type Span = { start: number; end: number; open: boolean };

const DRAG_SLOP_PX = 4;

export function draggedPast(
  dx: number,
  dy: number,
  slop: number = DRAG_SLOP_PX,
): boolean {
  return Math.hypot(dx, dy) >= slop;
}

export function eventLanding(
  span: Span,
  mode: "move" | "resize",
  atMinute: number,
  grabOffset: number,
): { time: string; endTime: string | null } {
  return mode === "resize"
    ? resizeSpan(span, atMinute)
    : moveSpan(span, atMinute - grabOffset);
}

export function eventKeyGesture(
  span: Span,
  key: string,
  shift: boolean,
):
  | { kind: "move"; time: string; endTime: string | null }
  | { kind: "day"; step: -1 | 1; time: string; endTime: string | null }
  | null {
  if (!shift && (key === "ArrowUp" || key === "ArrowDown")) {
    return {
      kind: "move",
      ...moveSpan(span, span.start + (key === "ArrowUp" ? -NUDGE_MINUTES : NUDGE_MINUTES)),
    };
  }
  if (shift && (key === "ArrowLeft" || key === "ArrowRight")) {
    return {
      kind: "day",
      step: key === "ArrowLeft" ? -1 : 1,
      time: toHhmm(span.start),
      endTime: span.open ? null : toHhmm(span.end),
    };
  }
  return null;
}

export function rangeFromAnchor(
  anchor: string,
  target: string,
): { start: string; end: string } {
  return anchor <= target
    ? { start: anchor, end: target }
    : { start: target, end: anchor };
}

export function pickedRange(
  anchor: string,
  target: string,
): { start: string; end: string | null } {
  return target === anchor
    ? { start: anchor, end: null }
    : rangeFromAnchor(anchor, target);
}

export function advanceRangePick(
  current: { start: string | null; end: string | null },
  date: string,
): { start: string; end: string | null } {
  return current.start === null || current.end !== null || date < current.start
    ? { start: date, end: null }
    : { start: current.start, end: date };
}

export function paintRange<T>(
  base: Record<string, T>,
  anchor: string,
  target: string,
  value: T,
  datesBetween: (from: string, to: string) => string[],
): Record<string, T> {
  const { start, end } = rangeFromAnchor(anchor, target);
  const next = { ...base };
  for (const date of datesBetween(start, end)) next[date] = value;
  return next;
}
