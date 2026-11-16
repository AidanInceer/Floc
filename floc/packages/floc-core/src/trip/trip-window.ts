import { dateRange, fromIsoDate, isIsoDate, type IsoDate } from "../dates/dates";
import { countWord } from "../text/count-word";

export type DayLoad = { date: IsoDate; events: number };

export type WindowCost = { days: number; events: number };

export function windowCost(
  days: DayLoad[],
  start: IsoDate | null,
  end: IsoDate | null,
): WindowCost {
  const kept = new Set(dateRange(start, end));
  const lost = days.filter((d) => !kept.has(d.date));
  return {
    days: lost.length,
    events: lost.reduce((n, d) => n + d.events, 0),
  };
}

export function windowCostNoun(cost: WindowCost): string | null {
  if (cost.days === 0) return null;
  const days = countWord(cost.days, "day");
  if (cost.events === 0) return days;
  return `${days} and ${countWord(cost.events, "event")}`;
}

export function windowCostLabel(cost: WindowCost): string | null {
  const noun = windowCostNoun(cost);
  return noun && `Remove ${noun}`;
}

export const MAX_TRIP_DAYS = 366;

export function windowProblem(start: unknown, end: unknown): string | null {
  if (start === null && end === null) return null;
  if (!isIsoDate(start) || !isIsoDate(end)) return "Pick both a start and an end.";
  if (start > end) return "The end date is before the start.";
  const days = (fromIsoDate(end).getTime() - fromIsoDate(start).getTime()) / 86_400_000 + 1;
  return days > MAX_TRIP_DAYS ? "Keep a trip to a year or less." : null;
}
