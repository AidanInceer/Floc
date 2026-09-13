/** Which date reminders a trip has today (#346). No timezones: the day is the UTC day, from 08:00 UTC. */
import { addDays, toIsoDate, type IsoDate } from "../dates/dates";
import type { ReminderKind } from "./rules";

export const REMINDER_HOUR_UTC = 8;

export function reminderDay(now: Date): IsoDate | null {
  return now.getUTCHours() >= REMINDER_HOUR_UTC ? toIsoDate(now) : null;
}

const aYearOn = (date: IsoDate) => `${Number(date.slice(0, 4)) + 1}${date.slice(4)}`;

export function remindersDue(
  trip: { startDate: IsoDate | null; endDate: IsoDate | null },
  today: IsoDate,
): ReminderKind[] {
  const { startDate, endDate } = trip;
  const due: ReminderKind[] = [];
  if (startDate && addDays(startDate, -7) === today) due.push("trip_starts_week");
  if (startDate === today) due.push("trip_starts_today");
  if (endDate && addDays(endDate, 3) === today) due.push("still_owe");
  if (startDate && aYearOn(startDate) === today) due.push("year_ago");
  return due;
}
