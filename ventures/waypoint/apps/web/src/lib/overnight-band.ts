/**
 * The overnight band's arithmetic (ticket 141), with no React around it.
 *
 * The band draws one cell per day, because that is what the database stores —
 * `day.overnight_place_id`, one column per day. What the reader sees as a
 * *stay* is a run of consecutive days that already agree, which is the derived
 * stop of rule 3: nothing here merges anything, and there is no stop to store.
 *
 * It lives in `lib/` rather than in the calendar because the grouping is the
 * part that is easy to get wrong and cheap to test — a run that comes back one
 * day short, or split in two where the days agree, is a lie about the trip.
 */
import { addDays } from "@/lib/dates";

/** The part of a calendar day the band actually reads. */
export type BandDay = {
  date: string;
  /** Drawn only to complete the Mon–Sun frame; there is no `day` row behind it. */
  outside: boolean;
  overnightPlaceId: number | null;
  overnightPlaceName: string | null;
};

/** A span of days the band is showing as one place: dragging, or just written. */
export type BandSpan = {
  start: string;
  end: string;
  placeId: number | null;
  placeName: string | null;
  /**
   * The days this span has taken *off* a run — what a shrink uncovers. They
   * have to be part of the picture: a handle dragged in off Friday that leaves
   * Friday drawn as it was reads as a split into two stays, which is the
   * opposite of what the gesture is doing.
   */
  uncovered?: [string, string][];
};

export type BandRun<D extends BandDay> = {
  placeId: number | null;
  placeName: string | null;
  /** Mid-drag: what letting go would write, drawn as a proposal. */
  preview: boolean;
  /** The run carries on past the left/right edge of the page being shown. */
  openStart: boolean;
  openEnd: boolean;
  days: D[];
};

/**
 * The bars for one page of the calendar.
 *
 * A run of days sharing a place is one item spanning its columns, so the name
 * is written once and the bar is genuinely continuous — seven cells each
 * repeating "Barcelona" would draw one stop as seven.
 *
 * Undecided days are the opposite: each is its own cell, because each is its
 * own target. They never join, or a click meant for Tuesday would land on a bar
 * that owns half the week.
 *
 * The runs always partition `shownDays` exactly, which is what lets the caller
 * lay them out as `span N` grid items in a single row.
 */
export function bandRuns<D extends BandDay>(
  shownDays: readonly D[],
  /** Every day the calendar knows of, so a run can be seen to continue offscreen. */
  days: readonly D[],
  overlay: BandSpan | null,
  /** True while a pointer is down: the overlay is a proposal, not a fact. */
  overlayIsDrag: boolean,
): BandRun<D>[] {
  const placeOf = (day: D) => {
    if (overlay && !day.outside && day.date >= overlay.start && day.date <= overlay.end) {
      return { id: overlay.placeId, name: overlay.placeName, preview: overlayIsDrag };
    }
    // A day the drag has pulled off its run reads as undecided from the first
    // pixel, because that is what letting go would make it.
    if (
      overlay?.uncovered?.some(
        ([from, to]) => !day.outside && day.date >= from && day.date <= to,
      )
    ) {
      return { id: null, name: null, preview: false };
    }
    return { id: day.overnightPlaceId, name: day.overnightPlaceName, preview: false };
  };

  const runs: BandRun<D>[] = [];
  for (const day of shownDays) {
    const place = placeOf(day);
    // An undecided, un-previewed day is a cell of its own; everything else
    // continues the run beside it when it agrees with it.
    const joins = place.id !== null || place.preview;
    const last = runs[runs.length - 1];
    if (last && joins && last.placeId === place.id && last.preview === place.preview) {
      last.days.push(day);
      continue;
    }
    runs.push({
      placeId: place.id,
      placeName: place.name,
      preview: place.preview,
      openStart: false,
      openEnd: false,
      days: [day],
    });
  }

  // A run that carries on past the page's edge is squared off there and grows
  // no handle: the day it would extend from isn't on screen to aim at.
  for (const run of runs) {
    const before = days[days.indexOf(run.days[0]) - 1];
    const after = days[days.indexOf(run.days[run.days.length - 1]) + 1];
    const continuing = (neighbour: D | undefined) =>
      run.placeId !== null &&
      !run.preview &&
      neighbour !== undefined &&
      neighbour.overnightPlaceId === run.placeId;
    run.openStart = continuing(before);
    run.openEnd = continuing(after);
  }
  return runs;
}

/**
 * The days a drag has pulled off the run it started on — the shrink's other
 * half. A handle drag says two things at once: these days take the place, and
 * those ones lose it.
 */
export function uncoveredBy(
  /** The run as it stood before the drag. */
  run: { runStart: string; runEnd: string },
  span: { start: string; end: string },
): [string, string][] {
  const ranges: [string, string][] = [];
  if (run.runStart < span.start) ranges.push([run.runStart, addDays(span.start, -1)]);
  if (run.runEnd > span.end) ranges.push([addDays(span.end, 1), run.runEnd]);
  return ranges;
}

/**
 * How far the run under `date` actually reaches — across the page's edges,
 * which is where the calendar's own view of it stops.
 */
export function runBoundsAt(
  days: readonly BandDay[],
  date: string,
  placeId: number | null,
): { start: string; end: string } {
  const at = days.findIndex((d) => d.date === date);
  if (at < 0 || placeId === null) return { start: date, end: date };
  let start = at;
  let end = at;
  while (start > 0 && days[start - 1].overnightPlaceId === placeId) start--;
  while (end < days.length - 1 && days[end + 1].overnightPlaceId === placeId) end++;
  return { start: days[start].date, end: days[end].date };
}
