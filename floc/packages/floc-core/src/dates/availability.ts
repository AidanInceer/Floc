import { addDays, dateRange, fromIsoDate, toIsoDate, type IsoDate } from "./dates";

export type AvailabilityRow = {
  userId: string;
  date: IsoDate;
  available: boolean;
};

export type IsoMonth = string;

export function monthOf(date: IsoDate): IsoMonth {
  return date.slice(0, 7);
}

export function thisMonth(): IsoMonth {
  return monthOf(toIsoDate(new Date()));
}

export function addMonths(month: IsoMonth, delta: number): IsoMonth {
  const [y, m] = month.split("-").map(Number);
  const zero = y * 12 + (m - 1) + delta;
  return `${String(Math.floor(zero / 12)).padStart(4, "0")}-${String((zero % 12) + 1).padStart(2, "0")}`;
}

export function formatMonth(month: IsoMonth): string {
  return fromIsoDate(`${month}-01`).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function daysInMonth(month: IsoMonth): IsoDate[] {
  const out: IsoDate[] = [];
  for (let d = `${month}-01`; monthOf(d) === month; d = addDays(d, 1)) {
    out.push(d);
  }
  return out;
}

export function monthGrid(month: IsoMonth): (IsoDate | null)[][] {
  const days = daysInMonth(month);
  const lead = (fromIsoDate(days[0]).getUTCDay() + 6) % 7;
  const cells: (IsoDate | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...days,
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (IsoDate | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"] as const;

export type Tally = {
  free: number;
  freeUserIds: string[];
};

export function tally(rows: AvailabilityRow[]): Map<IsoDate, Tally> {
  const out = new Map<IsoDate, Tally>();
  for (const row of rows) {
    if (!row.available) continue;
    const entry = out.get(row.date) ?? { free: 0, freeUserIds: [] };
    if (entry.freeUserIds.includes(row.userId)) continue;
    entry.freeUserIds.push(row.userId);
    entry.free += 1;
    out.set(row.date, entry);
  }
  return out;
}

export type Window = { start: IsoDate; end: IsoDate; free: number };

export function bestWindow(
  rows: AvailabilityRow[],
  minLength = 2,
): Window | null {
  const dated = [...tally(rows).entries()].sort(([a], [b]) => (a < b ? -1 : 1));
  if (dated.length === 0) return null;

  const top = Math.max(...dated.map(([, t]) => t.free));

  for (let threshold = top; threshold >= 1; threshold -= 1) {
    const best = longestRun(dated, threshold);
    if (best && runLength(best) >= minLength) {
      return { ...best, free: threshold };
    }
  }

  const [bestDay, bestTally] = dated.reduce((a, b) => (b[1].free > a[1].free ? b : a), dated[0]);
  return { start: bestDay, end: bestDay, free: bestTally.free };
}

function runLength(w: { start: IsoDate; end: IsoDate }): number {
  let n = 1;
  for (let d = w.start; d !== w.end; d = addDays(d, 1)) n += 1;
  return n;
}

function longestRun(
  dated: [IsoDate, Tally][],
  threshold: number,
): { start: IsoDate; end: IsoDate } | null {
  const eligible = new Set(
    dated.filter(([, t]) => t.free >= threshold).map(([d]) => d),
  );
  let best: { start: IsoDate; end: IsoDate } | null = null;
  let bestLen = 0;

  for (const start of [...eligible].sort((a, b) => a.localeCompare(b))) {
    if (eligible.has(addDays(start, -1))) continue;
    let end = start;
    let len = 1;
    while (eligible.has(addDays(end, 1))) {
      end = addDays(end, 1);
      len += 1;
    }
    if (len > bestLen) {
      bestLen = len;
      best = { start, end };
    }
  }

  return best;
}

export function tripCoverage(
  isFree: (date: IsoDate) => boolean,
  start: IsoDate | null,
  end: IsoDate | null,
): { free: number; total: number; missing: IsoDate[] } | null {
  if (!start || !end) return null;
  const days = dateRange(start, end);
  const missing = days.filter((d) => !isFree(d));
  return { free: days.length - missing.length, total: days.length, missing };
}

export function markedUserIds(rows: AvailabilityRow[]): string[] {
  return [...new Set(rows.map((row) => row.userId))];
}

export function freeDaysByUser(rows: AvailabilityRow[]): Partial<Record<string, number>> {
  const out: Partial<Record<string, number>> = {};
  for (const row of rows) out[row.userId] = (out[row.userId] ?? 0) + (row.available ? 1 : 0);
  return out;
}
