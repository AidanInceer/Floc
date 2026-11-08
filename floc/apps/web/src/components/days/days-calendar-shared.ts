/**
 * Shared vocabulary for the Days calendar (ticket 243, split from
 * `days-calendar.tsx`): the row shapes and grid constants the calendar and its
 * pieces — the day column, the stop strip, the dialogs — all read.
 */
import type { DayEventType, TransportType } from "@/db/schema";

/** Pixels per hour. Tall enough that a 15-minute block is still a target. */
export const HOUR_PX = 56;

/** Two or more empty hours in a row draw as one bar this tall. */
export const FOLD_PX = 30;

/** The gutter, the day before, the focus day, the day after (B5). The neighbours shrink to slivers on a phone. */
export const FOCUS_COLUMNS =
  "[--days-gutter:44px] [--days-side:38px] sm:[--days-gutter:60px] sm:[--days-side:11rem]";
export const FOCUS_TEMPLATE = "var(--days-gutter) var(--days-side) minmax(0, 1fr) var(--days-side)";

/** A slot with no trip day in it: before the first day or after the last. */
export const OUTSIDE_DAY_CLASS =
  "bg-[repeating-linear-gradient(135deg,var(--color-sheet-2)_0_6px,var(--color-sheet)_6px_12px)]";

export type CalendarDay = {
  id: number;
  date: string;
  weekday: string;
  dayOfMonth: string;
  longLabel: string;
  /** "Sat 4 Sep", where the long one won't fit. */
  shortLabel: string;
  /** Null is a real answer: nobody has decided yet. */
  overnightPlaceName: string | null;
  /** Sent back on extend, so a stay keeps its geocoded `place` row. */
  overnightPlaceId: number | null;
  /** A cap beside the first or last day; no `day` row behind it. */
  outside: boolean;
  isToday: boolean;
};

export type CalendarEvent = {
  id: number;
  dayId: number;
  type: DayEventType;
  transportType: TransportType | null;
  /** Falls back to place name, then category word — never blank. */
  title: string;
  placeName: string | null;
  time: string | null;
  endTime: string | null;
  allDay: boolean;
  hasNote: boolean;
  /** The focus day prints the start of it on the block. */
  note: string | null;
  /** Files parked on it (ticket 324) — the block wears a clip. */
  hasFiles: boolean;
  commentCount: number;
};

/** Where a drag currently says the event should land. */
export type Landing = {
  eventId: number;
  dayId: number;
  time: string;
  endTime: string | null;
};

/** Structural, not imported from the action — avoids pulling `"use server"` into the client bundle. */
export type OvernightPlace =
  | { placeId: number }
  | {
      name: string;
      providerId?: string | null;
      lat?: number | null;
      lng?: number | null;
      countryCode?: string | null;
    };

/** "Monday 12 May", or both ends of a run. */
export function describeSpan(
  days: CalendarDay[],
  span: { start: string; end: string },
): string {
  const label = (date: string) => days.find((d) => d.date === date)?.longLabel ?? date;
  return span.start === span.end
    ? label(span.start)
    : `${label(span.start)} – ${label(span.end)}`;
}
