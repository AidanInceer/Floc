/**
 * Availability maths for the Dates tab — turning "who can do which days" into
 * a calendar grid and a suggested window.
 *
 * Pure and dependency-free on purpose, like `money.ts`: this is the only real
 * logic on the tab, so it's the part worth unit-testing rather than clicking
 * through. Dates are `YYYY-MM-DD` strings throughout — no `Date` crosses a
 * boundary, and there is no timezone anywhere (non-negotiable 9).
 */
import { addDays, fromIsoDate, toIsoDate, type IsoDate } from "./dates";

export type AvailabilityRow = {
  userId: string;
  date: IsoDate;
  available: boolean;
};

/** `YYYY-MM`. The unit the calendar pages by. */
export type IsoMonth = string;

export function monthOf(date: IsoDate): IsoMonth {
  return date.slice(0, 7);
}

export function thisMonth(): IsoMonth {
  return monthOf(toIsoDate(new Date()));
}

export function addMonths(month: IsoMonth, delta: number): IsoMonth {
  const [y, m] = month.split("-").map(Number);
  // Months are 1-based here but 0-based in the arithmetic, so normalise, shift,
  // and let the modulo carry the year — no Date object needed.
  const zero = y * 12 + (m - 1) + delta;
  return `${String(Math.floor(zero / 12)).padStart(4, "0")}-${String((zero % 12) + 1).padStart(2, "0")}`;
}

export function monthsFrom(month: IsoMonth, count: number): IsoMonth[] {
  return Array.from({ length: count }, (_, i) => addMonths(month, i));
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

/**
 * The month as weeks of seven cells, Monday-first, padded with `null` either
 * side so every row is a full week and the columns line up under one header.
 */
export function monthGrid(month: IsoMonth): (IsoDate | null)[][] {
  const days = daysInMonth(month);
  // getUTCDay() is Sunday-0; we want Monday-0, so rotate.
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
  /** How many members have said yes to this date. */
  free: number;
  /** User ids that said yes, for the avatar row on a cell. */
  freeUserIds: string[];
};

/** Only `available: true` rows count — a `false` row reads the same as unanswered for the maths. */
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

/**
 * The window to suggest as the trip's dates. Deliberately doesn't wait for
 * everyone: walks thresholds downwards (everyone marked, then all-but-one,
 * ...) and takes the longest run at the highest threshold reaching
 * `minLength`. Ties go to the earlier window. Null only when nobody has
 * marked anything.
 */
export function bestWindow(
  rows: AvailabilityRow[],
  minLength = 2,
): Window | null {
  // Entries, not keys: the tally travels with its date, so no lookup can miss.
  const dated = [...tally(rows).entries()].sort(([a], [b]) => (a < b ? -1 : 1));
  if (dated.length === 0) return null;

  const top = Math.max(...dated.map(([, t]) => t.free));

  for (let threshold = top; threshold >= 1; threshold -= 1) {
    const best = longestRun(dated, threshold);
    if (best && runLength(best) >= minLength) {
      return { ...best, free: threshold };
    }
  }

  // Nothing reaches minLength: fall back to the single best-attended day.
  const [bestDay, bestTally] = dated.reduce((a, b) => (b[1].free > a[1].free ? b : a));
  return { start: bestDay, end: bestDay, free: bestTally.free };
}

function runLength(w: { start: IsoDate; end: IsoDate }): number {
  let n = 1;
  for (let d = w.start; d !== w.end; d = addDays(d, 1)) n += 1;
  return n;
}

/** Longest run of consecutive dates whose tally is at or above `threshold`. */
function longestRun(
  dated: [IsoDate, Tally][],
  threshold: number,
): { start: IsoDate; end: IsoDate } | null {
  const eligible = new Set(
    dated.filter(([, t]) => t.free >= threshold).map(([d]) => d),
  );
  let best: { start: IsoDate; end: IsoDate } | null = null;
  let bestLen = 0;

  for (const start of [...eligible].sort()) {
    // Only start a run at its first day, or every day would seed a duplicate.
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
