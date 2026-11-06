/**
 * Fill your days from a calendar (#444, ADR-031): which days an event touches, and which of the
 * days in range are still the person's to fill. Pure — the provider call and the writes live in
 * `server/calendar/`.
 *
 * Why no timezone maths: the read asks the provider for times in the calendar's own zone, so the
 * date in each string is already the calendar's local date (rule 10).
 */
import { daysInMonth, type IsoMonth } from "./availability";
import { addDays, dateRange, isIsoDate, type IsoDate } from "./dates";

/** The only fields the read ever asks for. Titles, places, notes and guests are never requested. */
export type CalendarEvent = {
  status?: string;
  start?: { date?: string; dateTime?: string };
  end?: { date?: string; dateTime?: string };
  attendees?: { self?: boolean; responseStatus?: string }[];
};

export type ImportRange = { start: IsoDate; end: IsoDate };

/** A year of days: past this the read would page for ever for a trip nobody plans that way. */
export const MAX_IMPORT_DAYS = 366;

const MIDNIGHT = /T00:00:00/;

function declinedBySelf(event: CalendarEvent): boolean {
  return (event.attendees ?? []).some((a) => a.self === true && a.responseStatus === "declined");
}

/** The date part of a start or end, and whether it came from an all-day event. */
function dayOf(moment: { date?: string; dateTime?: string } | undefined): { day: IsoDate; allDay: boolean; raw: string } | null {
  const raw = moment?.date ?? moment?.dateTime;
  const day = raw?.slice(0, 10);
  if (!raw || !day || !isIsoDate(day)) return null;
  return { day, allDay: moment?.date !== undefined, raw };
}

/** First and last day an event touches, or null when it carries no usable start. */
function span(event: CalendarEvent): ImportRange | null {
  const start = dayOf(event.start);
  if (!start) return null;
  const end = dayOf(event.end);
  if (!end || end.day <= start.day) return { start: start.day, end: start.day };
  // An all-day end date is exclusive, and so is a timed end at midnight: neither touches that day.
  const exclusive = start.allDay || MIDNIGHT.test(end.raw);
  return { start: start.day, end: exclusive ? addDays(end.day, -1) : end.day };
}

/** Days in `range` with an event the person has not declined and that is not cancelled. Sorted, once each. */
export function busyDays(events: CalendarEvent[], range: ImportRange): IsoDate[] {
  const busy = new Set<IsoDate>();
  for (const event of events) {
    if (event.status === "cancelled" || declinedBySelf(event)) continue;
    const s = span(event);
    if (!s) continue;
    const from = s.start < range.start ? range.start : s.start;
    const to = s.end > range.end ? range.end : s.end;
    if (from > to) continue;
    for (const day of dateRange(from, to)) busy.add(day);
  }
  return [...busy].sort((a, b) => a.localeCompare(b));
}

/** What to write: only days with no mark yet — free when the calendar is empty that day, busy when not. */
export function planFill(
  range: ImportRange,
  marked: ReadonlySet<IsoDate>,
  busy: ReadonlySet<IsoDate>,
): { free: IsoDate[]; busy: IsoDate[] } {
  const out = { free: [] as IsoDate[], busy: [] as IsoDate[] };
  for (const day of dateRange(range.start, range.end)) {
    if (marked.has(day)) continue;
    (busy.has(day) ? out.busy : out.free).push(day);
  }
  return out;
}

/** The trip's dates; on an undated trip (rule 9) the month on screen. Capped at a year. */
export function importRange(start: IsoDate | null, end: IsoDate | null, month: IsoMonth): ImportRange {
  if (start && end) {
    const last = addDays(start, MAX_IMPORT_DAYS - 1);
    return { start, end: end > last ? last : end };
  }
  const days = daysInMonth(month);
  return { start: days[0], end: days[days.length - 1] };
}

/** The one scope Floc asks Google for (ADR-031). The request itself narrows it to start, end, status and your own reply. */
export const GOOGLE_CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events.readonly";

/**
 * The consent request, the same on the web and the phone: only the calendar scope, and offline
 * access with a fresh consent so the reply carries a refresh token. Without one the hour-long
 * access token would send the person back to Google on every later read.
 */
export const GOOGLE_CALENDAR_CONSENT = {
  provider: "google" as const,
  scopes: [GOOGLE_CALENDAR_SCOPE],
  additionalParams: { access_type: "offline", prompt: "consent" },
};
