import type { IsoDate } from "./dates";

export type DatesMoment = "finding" | "set" | "started";

export function datesMoment(trip: { startDate: IsoDate | null; endDate: IsoDate | null }, today: IsoDate): DatesMoment {
  if (!trip.startDate || !trip.endDate) return "finding";
  return today < trip.startDate ? "set" : "started";
}
