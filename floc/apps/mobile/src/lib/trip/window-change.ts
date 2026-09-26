/**
 * Why: a shorter window or cleared dates delete the days outside it, with
 * their events, for good. The web asks first; the phone must too.
 */
import { windowCost, windowCostLabel, windowCostNoun } from "@floc/core/trip/trip-window";

type Day = { date: string; events: readonly unknown[] };

export function windowWarning(
  days: Day[] | undefined,
  start: string | null,
  end: string | null,
): { title: string; action: string } | null {
  if (!days) return { title: "Change the trip's dates?", action: "Change the dates" };
  const cost = windowCost(
    days.map((day) => ({ date: day.date, events: day.events.length })),
    start,
    end,
  );
  const noun = windowCostNoun(cost);
  if (!noun) return null;
  return { title: `Remove ${noun}?`, action: windowCostLabel(cost) ?? "Remove" };
}
