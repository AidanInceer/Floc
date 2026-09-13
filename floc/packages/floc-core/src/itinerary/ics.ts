/**
 * A trip's itinerary as an iCalendar file (RFC 5545), for #334.
 *
 * Times are floating — no `TZID`, no `Z` — because Floc stores none (rule 10):
 * 09:00 means 09:00 wherever the trip is, which is what a floating time says.
 */
import { addDays } from "../dates/dates";

export type CalendarEntry = {
  id: number;
  date: string;
  title: string;
  time: string | null;
  endTime: string | null;
  allDay: boolean;
  place: string | null;
  note: string | null;
};

const FOLD_AT = 75;

function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\r|\n/g, "\\n");
}

// Why: the limit is octets, so a multi-byte character must not be cut in two.
function fold(line: string): string {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let current = "";
  let size = 0;
  for (const char of line) {
    const bytes = encoder.encode(char).length;
    const limit = parts.length === 0 ? FOLD_AT : FOLD_AT - 1;
    if (size + bytes > limit) {
      parts.push(current);
      current = "";
      size = 0;
    }
    current += char;
    size += bytes;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

const compactDate = (date: string) => date.replace(/-/g, "");
const compactTime = (time: string) => `${time.replace(":", "")}00`;

function stamp(now: Date): string {
  return `${now.toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`;
}

function timing(entry: CalendarEntry): string[] {
  if (entry.allDay || !entry.time) {
    return [
      `DTSTART;VALUE=DATE:${compactDate(entry.date)}`,
      `DTEND;VALUE=DATE:${compactDate(addDays(entry.date, 1))}`,
    ];
  }
  const day = compactDate(entry.date);
  const start = `DTSTART:${day}T${compactTime(entry.time)}`;
  return entry.endTime ? [start, `DTEND:${day}T${compactTime(entry.endTime)}`] : [start];
}

function event(tripId: number, entry: CalendarEntry, now: Date): string[] {
  return [
    "BEGIN:VEVENT",
    `UID:trip-${tripId}-event-${entry.id}@floc`,
    `DTSTAMP:${stamp(now)}`,
    ...timing(entry),
    `SUMMARY:${escapeText(entry.title)}`,
    ...(entry.place ? [`LOCATION:${escapeText(entry.place)}`] : []),
    ...(entry.note ? [`DESCRIPTION:${escapeText(entry.note)}`] : []),
    "END:VEVENT",
  ];
}

export function tripCalendar({
  tripId,
  tripName,
  entries,
  now,
}: {
  tripId: number;
  tripName: string;
  entries: CalendarEntry[];
  now: Date;
}): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Floc//Itinerary//EN",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${escapeText(tripName)}`,
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
    "X-PUBLISHED-TTL:PT1H",
    ...entries.flatMap((entry) => event(tripId, entry, now)),
    "END:VCALENDAR",
  ];
  return `${lines.map(fold).join("\r\n")}\r\n`;
}
