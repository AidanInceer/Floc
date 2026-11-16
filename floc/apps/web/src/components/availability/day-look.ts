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
  picking: boolean;
  inPick: (date: string) => boolean;
  pending: (date: string) => boolean;
  hiOf: (date: string) => { hi: number; label: string } | undefined;
  hourDay: IsoDate | null;
};

export type DayLook = {
  mark: DayMark;
  mine: boolean;
  past: boolean;
  today: boolean;
  cut: boolean;
  hi?: number;
  selected?: boolean;
  label: string;
};

export function dayLook(c: DayContext, date: string): DayLook {
  const tally = c.tallies[date] ?? 0;
  const inTrip = !!c.tripStart && !!c.tripEnd && date >= c.tripStart && date <= c.tripEnd;
  const picking = c.tab === "trip" && c.picking;
  const inPick = c.inPick(date);
  const w = c.tab === "forecast" ? c.hiOf(date) : undefined;
  const mine = c.isFree(date);
  const selected = { mine, trip: inPick, forecast: c.hourDay === date, group: undefined }[c.tab];
  const parts = [
    `${formatDate(date)}: ${tally} of ${c.memberCount} free`,
    mine && "you can do it",
    inTrip && "in the trip",
    w && `${w.label}, high ${w.hi}°`,
  ];
  return {
    mark: dayMark({ tally, memberCount: c.memberCount, inTrip, picking, inPick, pending: c.pending(date) }),
    mine,
    past: date < c.now,
    today: date === c.now,
    cut: picking && inTrip && !inPick,
    hi: w?.hi,
    selected,
    label: parts.filter(Boolean).join(", "),
  };
}
