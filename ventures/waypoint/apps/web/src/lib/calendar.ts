/**
 * Pure geometry for the Days time grid (ticket 103): minutes on a clock,
 * block placement, overlap lanes. No DOM, no React.
 *
 * Times are `HH:MM` local to the itinerary, never a `Date` (rule 10:
 * no timezones). Minutes-since-midnight is the working unit.
 */

/** Keyboard nudge; pointer drags snap to the actual minute instead (ticket 141 follow-up). */
export const NUDGE_MINUTES = 15;

/** The latest minute an event can *start*: 23:59, so a day still contains it. */
export const LAST_START_MINUTE = 24 * 60 - 1;

/** The shortest an event can be dragged down to. */
export const MIN_EVENT_MINUTES = 15;

/** Reading size for an open-ended event; never a stored end. */
export const OPEN_ENDED_MINUTES = 30;

/** Fixed midnight-to-midnight grid — a widening window re-laid every day's geometry. */
export const DEFAULT_START_HOUR = 0;
export const DEFAULT_END_HOUR = 24;

/** `HH:MM` → minutes since midnight. Null for anything that isn't a time. */
export function toMinutes(time: string | null | undefined): number | null {
  if (!time) return null;
  const m = /^(\d{2}):(\d{2})$/.exec(time);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/** Minutes → `HH:MM`. 24:00 is reachable as an end (grid's bottom edge), never as a start. */
export function toHhmm(minutes: number): string {
  const m = Math.max(0, Math.min(24 * 60, Math.round(minutes)));
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** Nearest whole minute, or nearest `step` of them where something wants one. */
export function snap(minutes: number, step: number = 1): number {
  return Math.round(minutes / step) * step;
}

export function clamp(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value));
}

/** The bits of an event this module needs; the real row has plenty more. */
export type TimedLike = {
  id: number;
  time: string | null;
  endTime: string | null;
  allDay: boolean;
};

/** Minute span on the clock, or null for all-day/no-start (see `lib/event-order.ts`). `open` = end is drawn, not known. */
export function spanOf(
  event: TimedLike,
): { start: number; end: number; open: boolean } | null {
  if (event.allDay) return null;
  const start = toMinutes(event.time);
  if (start === null) return null;
  const end = toMinutes(event.endTime);
  if (end === null || end <= start) {
    return { start, end: Math.min(start + OPEN_ENDED_MINUTES, 24 * 60), open: true };
  }
  return { start, end, open: false };
}

/** Hours the grid draws: default window only ever widens, never omits an event. */
export function gridWindow(events: TimedLike[]): { startHour: number; endHour: number } {
  let startHour = DEFAULT_START_HOUR;
  let endHour = DEFAULT_END_HOUR;
  for (const e of events) {
    const span = spanOf(e);
    if (!span) continue;
    startHour = Math.min(startHour, Math.floor(span.start / 60));
    endHour = Math.max(endHour, Math.ceil(span.end / 60));
  }
  return { startHour: clamp(startHour, 0, 23), endHour: clamp(endHour, startHour + 1, 24) };
}

export type Block = { id: number; start: number; end: number };
export type PackedBlock = Block & { lane: number; lanes: number };

/**
 * Swim-lane placement for overlapping events, derived from times not a stored
 * lane. A *run* of mutually-overlapping events shares its width, so one
 * pile-up at noon doesn't narrow events alone on the clock at nine.
 */
export function packLanes(blocks: Block[]): PackedBlock[] {
  const sorted = blocks
    .slice()
    .sort((a, b) => a.start - b.start || b.end - a.end || a.id - b.id);

  const out: PackedBlock[] = [];
  let run: { block: Block; lane: number }[] = [];
  let runEnd = -1;

  const flush = () => {
    if (run.length === 0) return;
    const lanes = Math.max(...run.map((r) => r.lane)) + 1;
    for (const r of run) out.push({ ...r.block, lane: r.lane, lanes });
    run = [];
  };

  for (const block of sorted) {
    if (run.length > 0 && block.start >= runEnd) {
      flush();
      runEnd = -1;
    }
    const taken = new Set(
      run.filter((r) => r.block.end > block.start).map((r) => r.lane),
    );
    let lane = 0;
    while (taken.has(lane)) lane++;
    run.push({ block, lane });
    runEnd = Math.max(runEnd, block.end);
  }
  flush();

  return out;
}

/** Drag/nudge result: length preserved, pushed back off the bottom edge rather than truncated. Open-ended events only move their start. */
export function moveSpan(
  span: { start: number; end: number; open: boolean },
  toStart: number,
): { time: string; endTime: string | null } {
  const length = span.end - span.start;
  if (span.open) {
    return { time: toHhmm(clamp(snap(toStart), 0, LAST_START_MINUTE)), endTime: null };
  }
  const start = clamp(snap(toStart), 0, 24 * 60 - length);
  return { time: toHhmm(start), endTime: toHhmm(start + length) };
}

/** Dragging the bottom edge; resizing is how an open-ended event gains an end time. */
export function resizeSpan(
  span: { start: number; end: number },
  toEnd: number,
): { time: string; endTime: string } {
  const end = clamp(snap(toEnd), span.start + MIN_EVENT_MINUTES, 24 * 60);
  return { time: toHhmm(span.start), endTime: toHhmm(end) };
}

/** `09:00–11:30`, an en dash because it's a range and not a minus. */
export function formatSpan(event: {
  time: string | null;
  endTime: string | null;
  allDay: boolean;
}): string {
  if (event.allDay || !event.time) return "All day";
  return event.endTime ? `${event.time}–${event.endTime}` : event.time;
}

/** `2h 30m` — how long a block is, for the detail panel. */
export function formatLength(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}
