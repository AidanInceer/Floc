/** Which date reminders a trip has today (#346, #626). No timezones: the day is the UTC day, from 08:00 UTC. */
import { addDays, toIsoDate, type IsoDate } from "../dates/dates";
import type { ReminderKind } from "./rules";

export const REMINDER_HOUR_UTC = 8;

export function reminderDay(now: Date): IsoDate | null {
  return now.getUTCHours() >= REMINDER_HOUR_UTC ? toIsoDate(now) : null;
}

const aYearOn = (date: IsoDate) => `${Number(date.slice(0, 4)) + 1}${date.slice(4)}`;

/** Days after the end that Floc chases money still owed, only the person who owes (#626). */
export const STILL_OWE_AFTER_DAYS = { still_owe_week: 7, still_owe_month: 30 } as const;
export type StillOweKind = keyof typeof STILL_OWE_AFTER_DAYS;

export function isStillOwe(kind: ReminderKind): kind is StillOweKind {
  return kind in STILL_OWE_AFTER_DAYS;
}

export function remindersDue(
  trip: { startDate: IsoDate | null; endDate: IsoDate | null },
  today: IsoDate,
): ReminderKind[] {
  const { startDate, endDate } = trip;
  const due: ReminderKind[] = [];
  if (startDate && addDays(startDate, -7) === today) due.push("trip_starts_week");
  if (startDate === today) due.push("trip_starts_today");
  for (const [kind, days] of Object.entries(STILL_OWE_AFTER_DAYS) as [StillOweKind, number][]) {
    if (endDate && addDays(endDate, days) === today) due.push(kind);
  }
  if (startDate && aYearOn(startDate) === today) due.push("year_ago");
  return due;
}

/** Days after a person's last finished trip that Floc asks about the next one, while nothing is planned (#626, ADR-056). */
export const NEXT_TRIP_AFTER_DAYS = { next_trip_2m: 60, next_trip_6m: 180 } as const;
export type NextTripKind = keyof typeof NEXT_TRIP_AFTER_DAYS;

export function nextTripDue(lastEnd: IsoDate, today: IsoDate): NextTripKind | null {
  for (const [kind, days] of Object.entries(NEXT_TRIP_AFTER_DAYS) as [NextTripKind, number][]) {
    if (addDays(lastEnd, days) === today) return kind;
  }
  return null;
}
