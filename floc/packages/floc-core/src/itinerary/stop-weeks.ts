/**
 * The Days stop strip shows one trip week at a time (wireframe/days-week A): seven
 * days counted from the trip's first day, with the stops cut where a week ends.
 * Pure; the rows are the trip's days in order, as `deriveStops` takes them.
 */
import { addDays, type IsoDate } from "../dates/dates";
import type { Stop } from "./stops";

const WEEK = 7;

export type WeekSegment = {
  stop: Stop;
  /** The first column (0–6) the stop takes in this week. */
  column: number;
  span: number;
  cutLeft: boolean;
  cutRight: boolean;
};

export type StopWeek = {
  week: number;
  weeks: number;
  dates: IsoDate[];
  /** Dates after the trip's end that fill a short last week. */
  pad: IsoDate[];
  segments: WeekSegment[];
  note: string;
  /** The day index to step to for the week before or after; null at an end. */
  before: number | null;
  after: number | null;
};

export function stopWeek(dates: IsoDate[], stops: Stop[], focusIndex: number): StopWeek {
  const total = dates.length;
  const weeks = Math.max(1, Math.ceil(total / WEEK));
  const week = Math.min(Math.max(0, Math.floor(focusIndex / WEEK)), weeks - 1);
  const first = week * WEEK;
  const shown = dates.slice(first, first + WEEK);
  const last = first + shown.length - 1;

  const pad: IsoDate[] = [];
  const tail = shown.at(-1);
  for (let i = shown.length; i < WEEK && tail; i += 1) pad.push(addDays(tail, i - shown.length + 1));

  const segments: WeekSegment[] = [];
  let row = 0;
  for (const stop of stops) {
    const from = row;
    const to = row + stop.dayIds.length - 1;
    row = to + 1;
    if (to < first || from > last) continue;
    const start = Math.max(from, first);
    segments.push({
      stop,
      column: start - first,
      span: Math.min(to, last) - start + 1,
      cutLeft: from < first,
      cutRight: to > last,
    });
  }

  return {
    week,
    weeks,
    dates: shown,
    pad,
    segments,
    note: `Days ${first + 1}–${last + 1} of ${total}`,
    before: week > 0 ? first - WEEK : null,
    after: week < weeks - 1 ? first + WEEK : null,
  };
}
