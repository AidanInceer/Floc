/**
 * The trip's window against the days it owns (ticket 140). A day is addressed
 * by its own date, never by position in the window — so a date kept by both
 * old and new windows keeps its day/events, one only in the old window is
 * removed with its events, and one only in the new window becomes blank. A
 * window moved clear of the old one loses everything; `windowCost` surfaces
 * that number before the write. Pure: the calendar prices a window mid-drag,
 * and a round trip per pointer move isn't worth paying.
 */
import { dateRange, type IsoDate } from "./dates";

/** One live day and how much is planned on it. */
export type DayLoad = { date: IsoDate; events: number };

/** What a window change would destroy. Both zero means nothing is lost. */
export type WindowCost = { days: number; events: number };

/**
 * The days that fall outside `start`–`end`, and the events on them. A null
 * end (or reversed pair) means every day is outside it — what "Reset dates" costs.
 */
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

/** "2 days and 5 events", or "2 days". `null` means nothing to lose. */
export function windowCostNoun(cost: WindowCost): string | null {
  if (cost.days === 0) return null;
  const days = `${cost.days} ${cost.days === 1 ? "day" : "days"}`;
  if (cost.events === 0) return days;
  return `${days} and ${cost.events} ${cost.events === 1 ? "event" : "events"}`;
}

/** As a verb for the control that does it: "Remove 2 days and 5 events" — never "OK". */
export function windowCostLabel(cost: WindowCost): string | null {
  const noun = windowCostNoun(cost);
  return noun && `Remove ${noun}`;
}
