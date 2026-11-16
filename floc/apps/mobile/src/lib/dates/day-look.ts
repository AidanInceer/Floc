import { formatDate, type IsoDate } from "@floc/core/dates/dates";
import { dayMark, type DayMark } from "@floc/core/dates/day-marks";

import type { DateRange } from "./range";

export type DatesView = "mine" | "group" | "trip" | "forecast";

export type DayLook = {
  mark: DayMark;
  mine: boolean;
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
  isFree: (date: IsoDate) => boolean;
  range: DateRange | null;
  hiOf: (date: IsoDate) => { hi: number; label: string } | undefined;
};

type Row = { userId: string; date: IsoDate; available: boolean };

export function freeCounts(rows: Row[], me: string | undefined, edits: Record<IsoDate, boolean>): Map<IsoDate, number> {
  const out = new Map<IsoDate, number>();
  const seen = new Set<string>();
  for (const row of rows) {
    const key = `${row.userId} ${row.date}`;
    if (!row.available || seen.has(key)) continue;
    seen.add(key);
    out.set(row.date, (out.get(row.date) ?? 0) + 1);
  }
  for (const [date, on] of Object.entries(edits)) {
    const saved = seen.has(`${me} ${date}`);
    if (on === saved) continue;
    out.set(date, Math.max(0, (out.get(date) ?? 0) + (on ? 1 : -1)));
  }
  return out;
}

export function dayLookOf(c: LookContext, date: IsoDate): DayLook {
  const tally = c.counts.get(date) ?? 0;
  const inTrip = !!c.tripStart && !!c.tripEnd && date >= c.tripStart && date <= c.tripEnd;
  const picking = c.view === "trip" && c.range !== null;
  const inPick = !!c.range && date >= c.range.start && date <= c.range.end;
  const w = c.view === "forecast" ? c.hiOf(date) : undefined;
  const mine = c.isFree(date);
  const parts = [
    `${formatDate(date)}: ${tally} of ${c.memberCount} free`,
    mine && "you can do it",
    inTrip && "in the trip",
    w && `${w.label}, high ${w.hi}°`,
  ];
  return {
    mark: dayMark({ tally, memberCount: c.memberCount, inTrip, picking, inPick, pending: false }),
    mine,
    today: date === c.now,
    past: date < c.now,
    cut: picking && inTrip && !inPick,
    hi: w?.hi,
    label: parts.filter(Boolean).join(", "),
  };
}
