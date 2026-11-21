import { formatDate, type IsoDate } from "@floc/core/dates/dates";
import { dayMark, type DayMark } from "@floc/core/dates/day-marks";
import type { DatesTab } from "@/components/availability/dates-tabs";

export type DayContext = {
  tab: DatesTab;
  tallies: Record<string, number>;
  memberCount: number;
  tripStart: string | null;
  tripEnd: string | null;
  now: IsoDate;
  isFree: (date: string) => boolean;
  isLiked?: (date: string) => boolean;
  prefers?: (date: string) => number;
  answered?: number;
  picking: boolean;
  inPick: (date: string) => boolean;
  pending: (date: string) => boolean;
  hiOf: (date: string) => { hi: number; label: string } | undefined;
  hourDay: IsoDate | null;
};

export type DayLook = {
  mark: DayMark;
  mine: boolean;
  liked: boolean;
  past: boolean;
  today: boolean;
  cut: boolean;
  hi?: number;
  selected?: boolean;
  label: string;
};

const within = (date: string, start?: string | null, end?: string | null) => !!start && !!end && date >= start && date <= end;

function labelOf(
  c: DayContext,
  date: string,
  day: { tally: number; prefer: number; mine: boolean; liked: boolean; inTrip: boolean; weather?: { hi: number; label: string } },
): string {
  const parts = [
    `${formatDate(date)}: ${day.tally} of ${c.memberCount} free`,
    day.prefer > 0 && `${day.prefer} ${day.prefer === 1 ? "prefers" : "prefer"} it`,
    day.mine && (day.liked ? "you prefer it" : "you can do it"),
    day.inTrip && "in the trip",
    day.weather && `${day.weather.label}, high ${day.weather.hi}°`,
  ];
  return parts.filter(Boolean).join(", ");
}

export function dayLook(c: DayContext, date: string): DayLook {
  const tally = c.tallies[date] ?? 0;
  const inTrip = within(date, c.tripStart, c.tripEnd);
  const picking = c.tab === "trip" && c.picking;
  const inPick = c.inPick(date);
  const weather = c.tab === "forecast" ? c.hiOf(date) : undefined;
  const mine = c.isFree(date);
  const liked = mine && !!c.isLiked?.(date);
  const prefer = c.prefers?.(date) ?? 0;
  const selected = { mine, trip: inPick, forecast: c.hourDay === date, group: undefined }[c.tab];
  return {
    mark: dayMark({ tally, prefer, answered: c.answered, memberCount: c.memberCount, inTrip, picking, inPick, pending: c.pending(date) }),
    mine,
    liked,
    past: date < c.now,
    today: date === c.now,
    cut: picking && inTrip && !inPick,
    hi: weather?.hi,
    selected,
    label: labelOf(c, date, { tally, prefer, mine, liked, inTrip, weather }),
  };
}
