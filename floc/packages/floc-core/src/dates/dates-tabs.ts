/**
 * What each Dates tab says about itself before you open it: a value, a short form for a
 * phone's one row, and a note. `open` marks something still to do.
 */
import { dayParts, formatDate, nightsBetween, type IsoDate } from "./dates";

export type TabSummary = { value: string; short: string; note: string; open: boolean };

const count = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
const dayMonth = (d: IsoDate) => formatDate(d, { weekday: false });

export function compactRange(start: IsoDate, end: IsoDate): string {
  if (start.slice(0, 7) !== end.slice(0, 7)) return `${dayMonth(start)} – ${dayMonth(end)}`;
  return `${Number(start.slice(8, 10))}–${dayMonth(end)}`;
}

/** A span short enough for a stub: no year, and the month once when both ends share it. */
export function spanLabel(start: IsoDate, end: IsoDate): string {
  if (start.slice(0, 7) !== end.slice(0, 7)) return `${formatDate(start)} – ${formatDate(end)}`;
  const a = dayParts(start);
  return `${a.weekday} ${a.day} – ${formatDate(end)}`;
}

export function yourDaysTab(saved: IsoDate[], unsaved: number): TabSummary {
  if (saved.length === 0 && unsaved === 0)
    return { value: "Not yet", short: "Not yet", note: "Mark the days you can do", open: true };
  const sorted = [...saved].sort((a, b) => a.localeCompare(b));
  const value = saved.length ? count(saved.length, "day") : "Not yet";
  const note = unsaved
    ? `${count(unsaved, "change")} not saved`
    : spanLabel(sorted[0], sorted[sorted.length - 1]);
  return { value, short: value, note, open: unsaved > 0 };
}

export function groupTab(memberCount: number, waitingOn: string[]): TabSummary {
  const answered = memberCount - waitingOn.length;
  return {
    value: `${answered} of ${memberCount} answered`,
    short: `${answered} of ${memberCount}`,
    note: waitingOn.length ? `Waiting on ${waitingOn.join(", ")}` : "Everyone has answered",
    open: waitingOn.length > 0,
  };
}

export function tripTab(
  start: IsoDate | null,
  end: IsoDate | null,
  best: { start: IsoDate; end: IsoDate } | null,
): TabSummary {
  if (start && end)
    return { value: spanLabel(start, end), short: compactRange(start, end), note: count(nightsBetween(start, end), "night"), open: false };
  return {
    value: "No dates yet",
    short: "No dates",
    note: best ? `Best fit ${spanLabel(best.start, best.end)}` : "Pick the days",
    open: true,
  };
}

export function forecastTab(tripDays: number, forecastDays: number, horizonEnd: IsoDate | null): TabSummary {
  if (tripDays === 0) return { value: "No dates yet", short: "None", note: "Follows the trip's dates", open: false };
  return {
    value: `${forecastDays} of ${count(tripDays, "day")}`,
    short: `${forecastDays} of ${tripDays}`,
    note: horizonEnd ? `To ${formatDate(horizonEnd)}` : "Beyond the forecast",
    open: false,
  };
}
