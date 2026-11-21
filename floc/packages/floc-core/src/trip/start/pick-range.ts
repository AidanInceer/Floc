import { addDays, type IsoDate } from "../../dates/dates";

export type DateRange = { start: IsoDate | null; end: IsoDate | null };

export function pickRange(now: DateRange, day: IsoDate, nights?: number): DateRange {
  if (nights !== undefined) return { start: day, end: addDays(day, nights) };
  if (now.start && !now.end && day > now.start) return { start: now.start, end: day };
  return { start: day, end: null };
}
