import type { DayEventType, TransportType } from "@/db/schema";
import type { SlotOnly } from "@/lib/days/day-slots";

export const HOUR_PX = 56;

export const FOLD_PX = 30;

export const FOCUS_COLUMNS =
  "[--days-gutter:56px] [--days-side:38px] sm:[--days-gutter:60px] sm:[--days-side:11rem] [--days-tracks:var(--days-side)_minmax(0,1fr)_var(--days-side)] lg:[--days-tracks:var(--days-week)]";
export const FOCUS_TEMPLATE = "var(--days-gutter) var(--days-tracks)";

export const OUTSIDE_DAY_CLASS = "bg-paper";

export const WIDE_QUERY = "(min-width: 64rem)";

export function onlyClass(only: SlotOnly | undefined): string | undefined {
  if (only === "wide") return "max-lg:hidden";
  if (only === "narrow") return "lg:hidden";
  return undefined;
}

export type CalendarDay = {
  id: number;
  date: string;
  weekday: string;
  dayOfMonth: string;
  longLabel: string;
  shortLabel: string;
  overnightPlaceName: string | null;
  overnightPlaceId: number | null;
  outside: boolean;
  isToday: boolean;
  only?: SlotOnly;
};

export type CalendarEvent = {
  id: number;
  dayId: number;
  type: DayEventType;
  transportType: TransportType | null;
  title: string;
  writtenTitle: string | null;
  placeName: string | null;
  time: string | null;
  endTime: string | null;
  allDay: boolean;
  hasNote: boolean;
  note: string | null;
  hasFiles: boolean;
  commentCount: number;
};

export type Landing = {
  eventId: number;
  dayId: number;
  time: string;
  endTime: string | null;
};

export type OvernightPlace =
  | { placeId: number }
  | {
      name: string;
      providerId?: string | null;
      lat?: number | null;
      lng?: number | null;
      countryCode?: string | null;
    };

export function describeSpan(
  days: CalendarDay[],
  span: { start: string; end: string },
): string {
  const label = (date: string) => days.find((d) => d.date === date)?.longLabel ?? date;
  return span.start === span.end
    ? label(span.start)
    : `${label(span.start)} – ${label(span.end)}`;
}
