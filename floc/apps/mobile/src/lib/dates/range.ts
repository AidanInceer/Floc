import type { IsoDate } from "@floc/core/dates/dates";

export type DateRange = { start: IsoDate; end: IsoDate };

export function rangeFrom(anchor: IsoDate, target: IsoDate): DateRange {
  return anchor <= target ? { start: anchor, end: target } : { start: target, end: anchor };
}

export function rangeLook(range: DateRange | null, date: IsoDate): "end" | "inside" | "outside" {
  if (!range || date < range.start || date > range.end) return "outside";
  return date === range.start || date === range.end ? "end" : "inside";
}

/** Why: a tap then a tap is how a phone picks a range; a drag still paints the whole span at once. */
export function nextRange(current: DateRange | null, anchor: IsoDate, target: IsoDate): DateRange {
  const tap = anchor === target;
  if (tap && current && current.start === current.end) return rangeFrom(current.start, anchor);
  return rangeFrom(anchor, target);
}
