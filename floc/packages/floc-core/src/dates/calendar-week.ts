import { addDays, fromIsoDate, type IsoDate } from "./dates";

const WEEK = 7;

export type CalendarWeek = {
  indices: number[];
  monday: IsoDate;
  sunday: IsoDate;
  canPrev: boolean;
  canNext: boolean;
};

export function weekdayIndex(date: IsoDate): number {
  return (fromIsoDate(date).getUTCDay() + 6) % WEEK;
}

export function calendarWeek(focusDate: IsoDate, focusIndex: number, total: number): CalendarWeek {
  const offset = weekdayIndex(focusDate);
  const first = focusIndex - offset;
  return {
    indices: Array.from({ length: WEEK }, (_, i) => first + i),
    monday: addDays(focusDate, -offset),
    sunday: addDays(focusDate, WEEK - 1 - offset),
    canPrev: first > 0,
    canNext: first + WEEK < total,
  };
}

export function weekStep(focusIndex: number, total: number, by: -1 | 1): number {
  return Math.min(Math.max(focusIndex + by * WEEK, 0), total - 1);
}

export function weekTracks(indices: number[], focusIndex: number, total: number): string {
  const track = (i: number) => (i < 0 || i >= total ? "0.55fr" : i === focusIndex ? "1.6fr" : "1fr");
  return indices.map((i) => `minmax(0,${track(i)})`).join(" ");
}
