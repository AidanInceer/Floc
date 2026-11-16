export const NUDGE_MINUTES = 15;

export const LAST_START_MINUTE = 24 * 60 - 1;

const MIN_EVENT_MINUTES = 15;

const OPEN_ENDED_MINUTES = 30;

export function toMinutes(time: string | null | undefined): number | null {
  if (!time) return null;
  const m = /^(\d{2}):(\d{2})$/.exec(time);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

export function toHhmm(minutes: number): string {
  const m = Math.max(0, Math.min(24 * 60, Math.round(minutes)));
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

export function snap(minutes: number, step: number = 1): number {
  return Math.round(minutes / step) * step;
}

export function clamp(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value));
}

export type TimedLike = {
  id: number;
  time: string | null;
  endTime: string | null;
  allDay: boolean;
};

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

export type Block = { id: number; start: number; end: number };
export type PackedBlock = Block & { lane: number; lanes: number };

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

export function resizeSpan(
  span: { start: number; end: number },
  toEnd: number,
): { time: string; endTime: string } {
  const end = clamp(snap(toEnd), span.start + MIN_EVENT_MINUTES, 24 * 60);
  return { time: toHhmm(span.start), endTime: toHhmm(end) };
}

export function formatSpan(event: {
  time: string | null;
  endTime: string | null;
  allDay: boolean;
}): string {
  if (event.allDay || !event.time) return "All day";
  return event.endTime ? `${event.time}–${event.endTime}` : event.time;
}
