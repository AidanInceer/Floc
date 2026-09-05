/**
 * Overnight band arithmetic (ticket 141), no React. A "stay" is a run of
 * consecutive days sharing `overnight_place_id` — derived, per rule 3, never
 * stored. Kept in `lib/` and tested separately: a run one day short, or split
 * where the days agree, is a lie about the trip.
 */
import { addDays } from "./dates";

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
  /** Days this span has taken off a run — what a shrink drag uncovers. */
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
 * The bars for one page of the calendar. Runs of days sharing a place merge
 * into one spanning bar; undecided days stay separate cells (each its own
 * click target). Runs always partition `shownDays` exactly, so the caller can
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
    // A day pulled off its run reads as undecided immediately — what letting go would make it.
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

  // A run past the page's edge is squared off there with no handle — no day onscreen to aim at.
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

/** The days a drag has pulled off the run it started on — the shrink's other half. */
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

/** How far the run under `date` actually reaches, across the page's edges. */
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
