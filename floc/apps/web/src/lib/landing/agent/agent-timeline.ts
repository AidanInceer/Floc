import { LANES, type LaneRow } from "./agent-lanes";
import { typePrompt, type MarkId, type TypedPrompt } from "./agent-prompt";

const TYPE_START_MS = 300;
const SEND_AFTER_MS = 250;
const PRESS_MS = 260;

// Wide: each ask lights, then a line carries it to its card.
const MARKS: readonly MarkId[] = [1, 2, 3, 4, 5, 6];
const MARKS_AFTER_MS = 700;
const MARK_GAP_MS = 1150;
const LINE_AFTER_LIT_MS = 350;
const LINE_MS = 600;
const FAR_LINE_MS = 750;
const FILL_AFTER_IN_MS = 100;
const WIDE_DONE_AFTER_MS = 1400;

// Narrow: one lane per job, all at once, feeding one ticket.
const LANES_AFTER_MS = 650;
const LANE_STAGGER_MS = 110;
const STAMP_AFTER_MS = 600;
const NARROW_DONE_AFTER_MS = 300;

export type MarkBeat = { mark: MarkId; far: boolean; litAt: number; lineAt: number; lineMs: number; inAt: number; runAt: number };
export type LaneBeat = { runAt: number; doneAt: number };
export type AgentTimeline = {
  prompt: TypedPrompt;
  sentAt: number;
  pressedUntil: number;
  marks: MarkBeat[];
  wideDoneAt: number;
  lanes: LaneBeat[];
  rows: Record<LaneRow, number>;
  narrowLitAt: Record<MarkId, number>;
  stampAt: number;
  narrowDoneAt: number;
  /** Every moment something changes, once each, in order. */
  beats: number[];
};

function markBeats(start: number): MarkBeat[] {
  return MARKS.map((mark, i) => {
    // Why: cards sit in two staggered columns, 1 3 5 near and 2 4 6 far.
    const far = mark % 2 === 0;
    const litAt = start + i * MARK_GAP_MS;
    const lineAt = litAt + LINE_AFTER_LIT_MS;
    const lineMs = far ? FAR_LINE_MS : LINE_MS;
    const inAt = lineAt + lineMs;
    return { mark, far, litAt, lineAt, lineMs, inAt, runAt: inAt + FILL_AFTER_IN_MS };
  });
}

function laneBeats(start: number): LaneBeat[] {
  return LANES.map((lane, i) => {
    const runAt = start + i * LANE_STAGGER_MS;
    return { runAt, doneAt: runAt + lane.ms };
  });
}

/** A ticket row fills when the first lane feeding it finishes. */
function rowBeats(lanes: LaneBeat[]): Record<LaneRow, number> {
  const rows = {} as Record<LaneRow, number>;
  LANES.forEach(({ row }, i) => {
    rows[row] = Math.min(rows[row] ?? Infinity, lanes[i]!.doneAt);
  });
  return rows;
}

function narrowLit(lanes: LaneBeat[]): Record<MarkId, number> {
  const lit = {} as Record<MarkId, number>;
  LANES.forEach(({ mark }, i) => {
    if (mark) lit[mark] = lanes[i]!.runAt;
  });
  return lit;
}

/** The pocket agent scene, start to end: the same brief typed, then played out as marked cards (wide) or lanes into a ticket (narrow). */
export function agentTimeline(): AgentTimeline {
  const prompt = typePrompt(TYPE_START_MS);
  const sentAt = prompt.endMs + SEND_AFTER_MS;
  const marks = markBeats(prompt.endMs + MARKS_AFTER_MS);
  const wideDoneAt = marks.at(-1)!.litAt + WIDE_DONE_AFTER_MS;
  const lanes = laneBeats(prompt.endMs + LANES_AFTER_MS);
  const rows = rowBeats(lanes);
  const stampAt = Math.max(...lanes.map((l) => l.doneAt)) + STAMP_AFTER_MS;
  const narrowDoneAt = stampAt + NARROW_DONE_AFTER_MS;
  const all = [
    ...prompt.lines.flat().flatMap((p) => p.chars.map((c) => c.at)),
    prompt.endMs,
    sentAt,
    sentAt + PRESS_MS,
    ...marks.flatMap((m) => [m.litAt, m.lineAt, m.inAt, m.runAt]),
    wideDoneAt,
    ...lanes.flatMap((l) => [l.runAt, l.doneAt]),
    stampAt,
    narrowDoneAt,
  ];
  return {
    prompt,
    sentAt,
    pressedUntil: sentAt + PRESS_MS,
    marks,
    wideDoneAt,
    lanes,
    rows,
    narrowLitAt: narrowLit(lanes),
    stampAt,
    narrowDoneAt,
    beats: [...new Set(all)].sort((a, b) => a - b),
  };
}
