import type { IsoDate } from "./dates";

/** What the Dates page leads with, read from the trip's dates and today (rule 4) — never stored (#459). */
export type DatesMoment = "finding" | "set" | "started";

export function datesMoment(trip: { startDate: IsoDate | null; endDate: IsoDate | null }, today: IsoDate): DatesMoment {
  if (!trip.startDate || !trip.endDate) return "finding";
  return today < trip.startDate ? "set" : "started";
}
