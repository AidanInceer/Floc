/**
 * The overnight dialog's month calendar (wireframe/days-week F): two taps pick the
 * first and last night, and a bar under each week shows where the group sleeps
 * once the stay is saved. Pure; the web and the phone draw it.
 */
import { fromIsoDate, type IsoDate } from "../../dates/dates";

type Range = { start: IsoDate; end: IsoDate };

export type NightPick = Range & { picking: boolean };

/** One bar under a calendar week: no `place` key means days outside the trip. */
export type WeekRun = { span: number; place?: string | null; on?: boolean };

export function tapNight(pick: NightPick, date: IsoDate): NightPick {
  if (!pick.picking) return { start: date, end: date, picking: true };
  return date < pick.start
    ? { start: date, end: pick.end, picking: false }
    : { start: pick.start, end: date, picking: false };
}

/** Where the group sleeps on `date` after the save; null is a night not set. */
export function previewNight(
  date: IsoDate,
  current: string | null,
  pick: Range,
  was: Range & { placeName: string | null },
  name: string,
): string | null {
  if (date >= pick.start && date <= pick.end) return name.trim() || null;
  if (was.placeName && date >= was.start && date <= was.end) return null;
  return current;
}

/** How a date in the picked range is drawn: rounded where the range or a week starts and ends. */
export function rangeMark(date: IsoDate, pick: Range): { first: boolean; last: boolean } | null {
  if (date < pick.start || date > pick.end) return null;
  const weekday = (fromIsoDate(date).getUTCDay() + 6) % 7;
  return { first: date === pick.start || weekday === 0, last: date === pick.end || weekday === 6 };
}

export function weekRuns(
  week: (IsoDate | null)[],
  placeOf: (date: IsoDate) => string | null | undefined,
  on: (date: IsoDate) => boolean,
): WeekRun[] {
  const runs: WeekRun[] = [];
  for (const date of week) {
    const place = date ? placeOf(date) : undefined;
    const run: WeekRun = !date || place === undefined ? { span: 1 } : { span: 1, place, on: on(date) };
    const last = runs.at(-1);
    if (last && last.place === run.place && last.on === run.on && "place" in last === "place" in run) last.span += 1;
    else runs.push(run);
  }
  return runs;
}
