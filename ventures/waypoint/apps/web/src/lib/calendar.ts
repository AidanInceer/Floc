/**
 * The arithmetic behind the Days calendar (ticket 103).
 *
 * Days used to be a list of cards and is now a time grid — hours down, days
 * across — prototyped in `docs/mockups/days-calendar-v2.html`. Everything in
 * here is the pure part of that: minutes on a clock, where a block sits, and
 * which blocks have to share a column. No DOM, no React, so the rules are
 * testable on their own and the component is only geometry and gestures.
 *
 * Times are `HH:MM` strings local to the itinerary and nothing else (rule 10:
 * no timezones, no offsets, no `Date`). Minutes-since-midnight is the working
 * unit, because a grid position is a subtraction and string times can't be
 * subtracted.
 */

/** The snap. Everything the calendar creates or moves lands on a quarter hour. */
export const SNAP_MINUTES = 15;

/** The shortest an event can be dragged down to. */
export const MIN_EVENT_MINUTES = 15;

/**
 * How tall an event with a start but no end is drawn. It is a *point in time*,
 * not a span — `findOverlaps` already treats it as one — so this is a reading
 * size, never a stored end. The block says "no end time" and draws its bottom
 * edge dashed, and dragging that edge is what turns the guess into a fact.
 */
export const OPEN_ENDED_MINUTES = 30;

/**
 * The window the grid draws by default: the whole day, midnight to midnight.
 *
 * It started at six — a normal waking day, widened by the data when something
 * fell outside it — and the window moving under you turned out to be worse than
 * the scrolling it saved: the same hour sat at a different height on Tuesday
 * than on Monday, and adding an early ferry re-laid the entire grid. A fixed
 * midnight-to-midnight day is one geometry for every day of every trip.
 */
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

/**
 * Minutes → `HH:MM`. 24:00 is deliberately reachable, because it is the
 * grid's bottom edge and an event can end there; it is never a *start*, which
 * is what `clampStart` is for.
 */
export function toHhmm(minutes: number): string {
  const m = Math.max(0, Math.min(24 * 60, Math.round(minutes)));
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** Nearest quarter hour. */
export function snap(minutes: number, step: number = SNAP_MINUTES): number {
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

/**
 * Where an event sits on the clock, in minutes — or null if it doesn't sit on
 * the clock at all (all day, or a legacy row with no start time, which is the
 * same thing; see `lib/event-order.ts`).
 *
 * `open` says the end is drawn rather than known.
 */
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

/**
 * The hours the grid has to draw.
 *
 * Six to midnight covers a normal day, and the window is only ever *widened*
 * from there — an 04:40 airport run must not be a row you can't see, and a
 * calendar that silently omits an event is worse than a list that shows it in
 * the wrong place. Rounded out to whole hours so the gutter stays a clean
 * column of o'clocks.
 */
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
 * Side-by-side placement for events that share a slice of the clock — the
 * "swim lane" reading the grilling asked for, derived from the times rather
 * than from a stored lane. Two people doing different things at three o'clock
 * is allowed (see `findOverlaps`), so this never refuses an overlap; it only
 * decides how to draw one.
 *
 * An event takes the first lane nothing it collides with is using, and a *run*
 * of mutually-overlapping events shares its width. The run matters: without
 * it, one three-way pile-up at noon would narrow every event in the day to a
 * third, including the ones alone on the clock at nine.
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
    // Nothing in the run is still running, so it can't widen any further.
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

/**
 * Where a drag or a nudge actually puts an event.
 *
 * The length is preserved and the whole block is kept inside the day — pushed
 * back off the bottom edge rather than truncated, because a drag past midnight
 * means "as late as it goes", not "make it shorter". An open-ended event has no
 * length to preserve, so only its start moves and its end stays unwritten.
 */
export function moveSpan(
  span: { start: number; end: number; open: boolean },
  toStart: number,
): { time: string; endTime: string | null } {
  const length = span.end - span.start;
  if (span.open) {
    return { time: toHhmm(clamp(snap(toStart), 0, 24 * 60 - SNAP_MINUTES)), endTime: null };
  }
  const start = clamp(snap(toStart), 0, 24 * 60 - length);
  return { time: toHhmm(start), endTime: toHhmm(start + length) };
}

/**
 * Dragging the bottom edge. An open-ended event gains an end time by being
 * resized — that is the point of the handle — and nothing can be dragged
 * shorter than a quarter of an hour.
 */
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
