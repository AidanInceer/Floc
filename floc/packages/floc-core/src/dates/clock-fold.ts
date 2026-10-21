/**
 * The Days clock with its empty hours folded (B5 focus day). Pure geometry:
 * which hours draw, where each minute sits, and the free stretches worth an
 * add box. Minutes since midnight throughout, like `./calendar`.
 */
import { clamp } from "./calendar";

type Span = { start: number; end: number };

export type ClockSegment = {
  from: number;
  to: number;
  /** An empty run drawn as one short bar. */
  folded: boolean;
  y: number;
  height: number;
};

export type ClockLayout = {
  segments: ClockSegment[];
  height: number;
  from: number;
  to: number;
};

const HOUR = 60;
const EMPTY_FROM = 8;
const EMPTY_TO = 20;
/** Shorter than this, a gap is a breath between plans, not room for another. */
const FREE_MINUTES = 90;

/**
 * Folded: an hour either side of the events, and two or more empty hours in a
 * row as one bar. Unfolded: every hour of the day, so any time can be clicked.
 */
export function foldedClock(
  spans: Span[],
  { hourPx, foldPx, unfold }: { hourPx: number; foldPx: number; unfold: boolean },
): ClockLayout {
  let lo = 0;
  let hi = 24;
  if (!unfold) {
    lo = spans.length ? Math.max(0, Math.floor(Math.min(...spans.map((s) => s.start)) / HOUR) - 1) : EMPTY_FROM;
    hi = spans.length ? Math.min(24, Math.ceil(Math.max(...spans.map((s) => s.end)) / HOUR) + 1) : EMPTY_TO;
  }
  const busy = (h: number) => spans.some((s) => s.start < (h + 1) * HOUR && s.end > h * HOUR);

  const segments: ClockSegment[] = [];
  let y = 0;
  for (let h = lo; h < hi; ) {
    let run = 0;
    while (h + run < hi && !busy(h + run)) run++;
    const folded = !unfold && run >= 2 && h > lo && h + run < hi;
    const length = folded ? run : 1;
    const height = folded ? foldPx : hourPx;
    segments.push({ from: h * HOUR, to: (h + length) * HOUR, folded, y, height });
    y += height;
    h += length;
  }
  return { segments, height: y, from: lo * HOUR, to: hi * HOUR };
}

export function yAt(clock: ClockLayout, minute: number): number {
  const m = clamp(minute, clock.from, clock.to);
  const s = clock.segments.find((x) => m >= x.from && m <= x.to) ?? clock.segments[0];
  return s.y + ((m - s.from) / (s.to - s.from)) * s.height;
}

export function minuteAt(clock: ClockLayout, y: number): number {
  const at = clamp(y, 0, clock.height);
  const s = clock.segments.find((x) => at >= x.y && at <= x.y + x.height) ?? clock.segments[0];
  return s.from + ((at - s.y) / s.height) * (s.to - s.from);
}

/** Room between events for another plan, unless a fold already says so. */
export function freeStretches(spans: Span[], clock: ClockLayout): { from: number; to: number }[] {
  const sorted = spans.slice().sort((a, b) => a.start - b.start);
  const out: { from: number; to: number }[] = [];
  let end = sorted[0]?.end ?? 0;
  for (const s of sorted.slice(1)) {
    if (s.start - end >= FREE_MINUTES) out.push({ from: end, to: s.start });
    end = Math.max(end, s.end);
  }
  return out.filter(
    ({ from, to }) => !clock.segments.some((s) => s.folded && s.from < to && s.to > from),
  );
}
