import { formatDate, type IsoDate } from "@floc/core/dates/dates";
import { dayMark, type DayMark } from "@floc/core/dates/day-marks";
import type { PaintMark } from "@floc/core/dates/finding/day-paint";

import type { DateRange } from "./range";

export type DatesView = "mine" | "group" | "trip" | "forecast";

export type DayLook = {
  mark: DayMark;
  mine: boolean;
  own?: PaintMark;
  today: boolean;
  past: boolean;
  cut?: boolean;
  hi?: number;
  label: string;
};

export type LookContext = {
  view: DatesView;
  counts: Map<IsoDate, number>;
  memberCount: number;
  tripStart: IsoDate | null;
  tripEnd: IsoDate | null;
  now: IsoDate;
  markOf: (date: IsoDate) => PaintMark;
  prefers: (date: IsoDate) => number;
  answered?: number;
  range: DateRange | null;
  hiOf: (date: IsoDate) => { hi: number; label: string } | undefined;
};

type Row = { userId: string; date: IsoDate; available: boolean };

export type MarkRow = Row & { preferred: boolean };

export function storedMarks(rows: MarkRow[], me: string | undefined): (date: IsoDate) => PaintMark {
  const liked = new Set<string>();
  const free = new Set<string>();
  for (const row of rows) {
    if (row.userId !== me || !row.available) continue;
    free.add(row.date);
    if (row.preferred) liked.add(row.date);
  }
  return (date) => (liked.has(date) ? "prefer" : free.has(date) ? "free" : "off");
}

export function freeCounts(rows: Row[], me: string | undefined, edits: Record<IsoDate, PaintMark>): Map<IsoDate, number> {
  const out = new Map<IsoDate, number>();
  const seen = new Set<string>();
  for (const row of rows) {
    const key = `${row.userId} ${row.date}`;
    if (!row.available || seen.has(key)) continue;
    seen.add(key);
    out.set(row.date, (out.get(row.date) ?? 0) + 1);
  }
  for (const [date, mark] of Object.entries(edits)) {
    const on = mark !== "off";
    const saved = seen.has(`${me} ${date}`);
    if (on === saved) continue;
    out.set(date, Math.max(0, (out.get(date) ?? 0) + (on ? 1 : -1)));
  }
  return out;
}

export function answeredCount(people: { id: string; days: number | null }[], me: string | undefined, youMarked: boolean): number {
  return people.filter((p) => p.days !== null && p.id !== me).length + (youMarked ? 1 : 0);
}

export function preferCounts(rows: MarkRow[], me: string | undefined, markOf: (date: IsoDate) => PaintMark): (date: IsoDate) => number {
  const others = new Map<IsoDate, number>();
  for (const row of rows) if (row.available && row.preferred && row.userId !== me) others.set(row.date, (others.get(row.date) ?? 0) + 1);
  return (date) => (others.get(date) ?? 0) + (markOf(date) === "prefer" ? 1 : 0);
}

const OWN_SAID: Record<PaintMark, string> = { off: "", free: "you can do it", prefer: "you prefer it" };

function labelOf(date: IsoDate, free: string, own: PaintMark, prefer: number, inTrip: boolean, w: { hi: number; label: string } | undefined): string {
  const parts = [`${formatDate(date)}: ${free}`, OWN_SAID[own], prefer > 0 && `${prefer} ${prefer === 1 ? "prefers" : "prefer"} it`, inTrip && "in the trip", w && `${w.label}, high ${w.hi}°`];
  return parts.filter(Boolean).join(", ");
}

export function dayLookOf(c: LookContext, date: IsoDate): DayLook {
  const tally = c.counts.get(date) ?? 0;
  const inTrip = !!c.tripStart && !!c.tripEnd && date >= c.tripStart && date <= c.tripEnd;
  const picking = c.view === "trip" && c.range !== null;
  const inPick = !!c.range && date >= c.range.start && date <= c.range.end;
  const w = c.view === "forecast" ? c.hiOf(date) : undefined;
  const own = c.markOf(date);
  const prefer = c.prefers(date);
  const mine = own !== "off";
  return {
    mark: dayMark({ tally, prefer, answered: c.answered, memberCount: c.memberCount, inTrip, picking, inPick, pending: false }),
    mine,
    own,
    today: date === c.now,
    past: date < c.now,
    cut: picking && inTrip && !inPick,
    hi: w?.hi,
    label: labelOf(date, `${tally} of ${c.memberCount} free`, own, prefer, inTrip, w),
  };
}
