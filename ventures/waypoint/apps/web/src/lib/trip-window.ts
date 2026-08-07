/**
 * The trip's window against the days it owns (ticket 140).
 *
 * The window *is* the extent of the itinerary — not a headline the days may
 * disagree with. So changing it changes the days, and this module is the one
 * place that says how:
 *
 * - A day keeps its own **date**. There is no shift and no offset: a day is
 *   addressed by the date it is on, never by its position in the window.
 * - A date in both the old window and the new one keeps its day and its events.
 * - A date only in the old window is removed, with its events.
 * - A date only in the new window becomes a blank day.
 *
 * So 1–7 Sep → 3–9 Sep keeps 3–7, cuts 1–2, and adds blank days on 8–9. A
 * window that moves clear of the old one keeps nothing — 1–7 Sep → 8–14 Sep
 * loses all seven days. That is accepted rather than overlooked: the rule is one
 * line, and `windowCost` makes the loss a number the user reads *before* the
 * write. The alternative considered and rejected was addressing a day by its
 * position, so a moved window carried the plan with it; it reads well for a
 * window dragged wholesale and badly for one whose start edge alone is pulled
 * back, which moves a plan nobody asked to move.
 *
 * Pure on purpose: the calendar has to price a window the user is still
 * dragging, and a round trip per pointer move is not a price worth paying.
 */
import { dateRange, type IsoDate } from "@/lib/dates";

/** One live day and how much is planned on it. */
export type DayLoad = { date: IsoDate; events: number };

/** What a window change would destroy. Both zero means nothing is lost. */
export type WindowCost = { days: number; events: number };

/**
 * The days that fall outside `start`–`end`, and the events on them.
 *
 * A null end (or a reversed pair) is an empty window, so *every* day is
 * outside it — which is exactly what "Reset dates" costs.
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

/**
 * What is lost, as a noun phrase: "2 days and 5 events", or "2 days" where
 * none of them holds anything. `null` when there is nothing to lose, which is
 * what every caller tests to decide whether to ask at all.
 */
export function windowCostNoun(cost: WindowCost): string | null {
  if (cost.days === 0) return null;
  const days = `${cost.days} ${cost.days === 1 ? "day" : "days"}`;
  if (cost.events === 0) return days;
  return `${days} and ${cost.events} ${cost.events === 1 ? "event" : "events"}`;
}

/**
 * The same thing as a verb, for the control that is about to do it: "Remove 2
 * days and 5 events". A button says what pressing it does — never "OK".
 */
export function windowCostLabel(cost: WindowCost): string | null {
  const noun = windowCostNoun(cost);
  return noun && `Remove ${noun}`;
}
