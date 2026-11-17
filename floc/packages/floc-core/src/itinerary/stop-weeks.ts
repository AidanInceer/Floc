import { addDays, type IsoDate } from "../dates/dates";
import type { Stop } from "./stops";

const WEEK = 7;

export type WeekSegment = {
  stop: Stop;
  column: number;
  span: number;
  cutLeft: boolean;
  cutRight: boolean;
};

export type StopWeek = {
  week: number;
  weeks: number;
  dates: IsoDate[];
  pad: IsoDate[];
  segments: WeekSegment[];
  note: string;
  before: number | null;
  after: number | null;
};

export function stopSegments(stops: Stop[], first: number, last: number): WeekSegment[] {
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
  return segments;
}

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

  const segments = stopSegments(stops, first, last);

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
