import { daysInMonth, type IsoMonth } from "./availability";
import { addDays, dateRange, isIsoDate, type IsoDate } from "./dates";

export type CalendarEvent = {
  status?: string;
  eventType?: string;
  start?: { date?: string; dateTime?: string };
  end?: { date?: string; dateTime?: string };
  attendees?: { self?: boolean; responseStatus?: string }[];
};

export type ImportRange = { start: IsoDate; end: IsoDate };

export const MAX_IMPORT_DAYS = 366;

const MIDNIGHT = /T00:00:00/;

function declinedBySelf(event: CalendarEvent): boolean {
  return (event.attendees ?? []).some((a) => a.self === true && a.responseStatus === "declined");
}

function dayOf(moment: { date?: string; dateTime?: string } | undefined): { day: IsoDate; allDay: boolean; raw: string } | null {
  const raw = moment?.date ?? moment?.dateTime;
  const day = raw?.slice(0, 10);
  if (!raw || !day || !isIsoDate(day)) return null;
  return { day, allDay: moment?.date !== undefined, raw };
}

function span(event: CalendarEvent): ImportRange | null {
  const start = dayOf(event.start);
  if (!start) return null;
  const end = dayOf(event.end);
  if (!end || end.day <= start.day) return { start: start.day, end: start.day };
  const exclusive = start.allDay || MIDNIGHT.test(end.raw);
  return { start: start.day, end: exclusive ? addDays(end.day, -1) : end.day };
}

const NOT_PLANS = new Set(["birthday", "workingLocation"]);

export type BusyOptions = { allDayOnly?: boolean };

function counts(event: CalendarEvent, opts: BusyOptions): boolean {
  if (event.status === "cancelled" || declinedBySelf(event)) return false;
  if (event.eventType && NOT_PLANS.has(event.eventType)) return false;
  return !opts.allDayOnly || event.start?.date !== undefined;
}

export function busyDays(events: CalendarEvent[], range: ImportRange, opts: BusyOptions = {}): IsoDate[] {
  const busy = new Set<IsoDate>();
  for (const event of events) {
    if (!counts(event, opts)) continue;
    const s = span(event);
    if (!s) continue;
    const from = s.start < range.start ? range.start : s.start;
    const to = s.end > range.end ? range.end : s.end;
    if (from > to) continue;
    for (const day of dateRange(from, to)) busy.add(day);
  }
  return [...busy].sort((a, b) => a.localeCompare(b));
}

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

export function importRange(start: IsoDate | null, end: IsoDate | null, month: IsoMonth): ImportRange {
  if (start && end) {
    const last = addDays(start, MAX_IMPORT_DAYS - 1);
    return { start, end: end > last ? last : end };
  }
  const days = daysInMonth(month);
  return { start: days[0], end: days[days.length - 1] };
}

export const GOOGLE_CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events.readonly";

export const GOOGLE_CALENDAR_CONSENT = {
  provider: "google" as const,
  scopes: [GOOGLE_CALENDAR_SCOPE],
  additionalParams: { access_type: "offline", prompt: "consent" },
};
