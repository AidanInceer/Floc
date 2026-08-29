/**
 * What a gesture *means*, for the two range calendars (ticket 243). A press, a
 * drag or a keystroke is reduced to the change it asks for here — free of the
 * DOM the component reads it from, so the rules can be tabled and tested. The
 * component keeps only the drawing and the dispatch.
 *
 * Times/dates stay strings (rule 10: no timezones); minutes are the working
 * unit on the clock, as in `lib/calendar.ts`.
 */
import {
  NUDGE_MINUTES,
  moveSpan,
  resizeSpan,
  toHhmm,
} from "@/lib/calendar";
import type { BandSpan } from "@/lib/overnight-band";

/** A minute span on the clock, the shape `spanOf` returns. */
type Span = { start: number; end: number; open: boolean };

/** How far a press has to travel before it counts as a drag, not a click — a
 * few pixels of slop so an unsteady hand still clicks (ticket 141). */
const DRAG_SLOP_PX = 4;

/** Has the pointer moved past the slop since the press started? */
export function draggedPast(
  dx: number,
  dy: number,
  slop: number = DRAG_SLOP_PX,
): boolean {
  return Math.hypot(dx, dy) >= slop;
}

/**
 * Where a pointer drag lands an event. Move keeps the block under the cursor by
 * the offset it was grabbed at; resize drags the bottom edge alone. Both defer
 * the clamping/snapping to `lib/calendar.ts`.
 */
export function eventLanding(
  span: Span,
  mode: "move" | "resize",
  atMinute: number,
  grabOffset: number,
): { time: string; endTime: string | null } {
  return mode === "resize"
    ? resizeSpan(span, atMinute)
    : moveSpan(span, atMinute - grabOffset);
}

/**
 * The keyboard's equal of the drag (ticket 141): ↑/↓ nudge a quarter hour,
 * shift+←/→ move a whole day. A `day` step names the direction only — which day
 * that lands on, and whether one exists there, is the caller's to resolve.
 * Null for a key the block ignores.
 */
export function eventKeyGesture(
  span: Span,
  key: string,
  shift: boolean,
):
  | { kind: "move"; time: string; endTime: string | null }
  | { kind: "day"; step: -1 | 1; time: string; endTime: string | null }
  | null {
  if (!shift && (key === "ArrowUp" || key === "ArrowDown")) {
    return {
      kind: "move",
      ...moveSpan(span, span.start + (key === "ArrowUp" ? -NUDGE_MINUTES : NUDGE_MINUTES)),
    };
  }
  if (shift && (key === "ArrowLeft" || key === "ArrowRight")) {
    return {
      kind: "day",
      step: key === "ArrowLeft" ? -1 : 1,
      time: toHhmm(span.start),
      endTime: span.open ? null : toHhmm(span.end),
    };
  }
  return null;
}

/**
 * A drag over dates, recomputed from its anchor each move so dragging back
 * shrinks rather than leaving a hole (tickets 127/135/141). The one shape the
 * overnight band and both availability drags had each copied — ISO dates order
 * lexically, so the smaller string is the start.
 */
export function rangeFromAnchor(
  anchor: string,
  target: string,
): { start: string; end: string } {
  return anchor <= target
    ? { start: anchor, end: target }
    : { start: target, end: anchor };
}

/**
 * Picking the trip window is the same drag, but coming back to its own start
 * collapses to a half-made range — a start with no end can't be committed as a
 * pair by accident (ticket 135).
 */
export function pickedRange(
  anchor: string,
  target: string,
): { start: string; end: string | null } {
  return target === anchor
    ? { start: anchor, end: null }
    : rangeFromAnchor(anchor, target);
}

/**
 * One click while picking the window (ticket 135): the first sets a start, the
 * second sets the end; a click before the start restarts from there, since
 * nobody means "end before start".
 */
export function advanceRangePick(
  current: { start: string | null; end: string | null },
  date: string,
): { start: string; end: string | null } {
  return current.start === null || current.end !== null || date < current.start
    ? { start: date, end: null }
    : { start: current.start, end: date };
}

/**
 * Painting availability over a drag (ticket 127): the whole span from anchor to
 * target is set to one value, over the base the drag started from — recomputed
 * each move, never cell-by-cell, so a fast drag that skips cells leaves no holes.
 */
export function paintRange(
  base: Record<string, boolean>,
  anchor: string,
  target: string,
  value: boolean,
  datesBetween: (from: string, to: string) => string[],
): Record<string, boolean> {
  const { start, end } = rangeFromAnchor(anchor, target);
  const next = { ...base };
  for (const date of datesBetween(start, end)) next[date] = value;
  return next;
}

/** The end of a band drag, minus the DOM: the pressed day and whether it moved. */
type BandRelease = {
  mode: "paint" | "extend";
  pressedDate: string;
  placeId: number | null;
  placeName: string | null;
  moved: boolean;
};

/**
 * What letting go of a band drag does (ticket 141). A press that never moved is
 * about its one day, so it opens the dialog there; painting undecided days has
 * no place to write yet, so it asks for one; only an extend of a run that
 * already has a place commits straight away.
 */
export function resolveBandRelease(
  drag: BandRelease,
  span: BandSpan | null,
):
  | { kind: "dialog"; span: BandSpan }
  | { kind: "commit"; span: BandSpan; placeId: number; uncovered: [string, string][] } {
  if (!drag.moved || !span) {
    return {
      kind: "dialog",
      span: {
        start: drag.pressedDate,
        end: drag.pressedDate,
        placeId: drag.placeId,
        placeName: drag.placeName,
      },
    };
  }
  if (drag.mode === "paint" || drag.placeId === null) {
    return { kind: "dialog", span };
  }
  return {
    kind: "commit",
    span,
    placeId: drag.placeId,
    uncovered: span.uncovered ?? [],
  };
}
