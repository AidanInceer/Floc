"use client";

/**
 * The one way a date is picked anywhere in Waypoint (tickets 87, 128).
 *
 * It began as the Route tab's stop-dates field: two plain `<input type="date">`
 * boxes made you type a stop into a trip you were already looking at, and the
 * native picker offered every date there has ever been. Ticket 128 finished the
 * job — the Dates tab set the trip's own window with the same two native boxes,
 * whose popover opens on the current month however far off the trip is, puts no
 * bound on the end, and looks like the browser rather than like the app. A trip
 * starting in January 2027 was picked from a calendar sitting in August 2026.
 *
 * So: one grid, no native popover left in the app. Press the start and drag to
 * the end, or click the two ends in turn; a click on a finished window starts a
 * new one, and while only the start is picked it wears a ring and the days
 * under the pointer fill at half strength (ticket 135). The end can't precede
 * the start because there is nowhere to say so, which is a stronger guarantee
 * than a `min` attribute. The grid is the Dates tab's own grid (`availability-
 * calendar.tsx`): same cell, same weekday header, same paging, same gesture, so
 * a stop's dates are chosen the way the trip's dates were.
 *
 * `min`/`max` are optional. Bounded, days outside render disabled rather than
 * being dropped, so the grid keeps its shape and a month at the edge of the
 * trip doesn't reflow (ticket 87). Unbounded — the trip's own dates, which
 * answer to nothing — every day is takeable.
 *
 * The real values travel in hidden inputs, so a surrounding server action sees
 * exactly the same `startDate`/`endDate` fields it did when these were date
 * inputs.
 */
import { useRef, useState } from "react";

import { Button, cx } from "@/components/ui";
import {
  WEEKDAY_LABELS,
  addMonths,
  formatMonth,
  monthGrid,
  monthOf,
  monthsFrom,
  thisMonth,
} from "@/lib/availability";
import { formatDate } from "@/lib/dates";

export function DateRangePicker({
  startName,
  endName,
  min,
  max,
  defaultStart,
  defaultEnd,
  openMonth,
  /** How many months to show at once. The trip window is usually one or two. */
  monthCount = 2,
  /**
   * Start closed, behind a summary line that opens it. For a field most people
   * skip — the optional dates on the create-trip form — where a month grid
   * sitting open is more surface than the question deserves.
   */
  collapsible = false,
}: {
  startName: string;
  endName: string;
  /** First selectable date. Omit for no lower bound. */
  min?: string;
  /** Last selectable date. Omit for no upper bound. */
  max?: string;
  defaultStart?: string;
  defaultEnd?: string;
  /**
   * Which month to open on when nothing is picked yet — the trip's own month,
   * or the group's best overlap. Falls back to `min`, then to now. Never
   * "today" when the caller knows better, which is the whole complaint that
   * ticket 128 started from.
   */
  openMonth?: string;
  monthCount?: number;
  collapsible?: boolean;
}) {
  const [start, setStart] = useState<string | null>(defaultStart ?? null);
  const [end, setEnd] = useState<string | null>(defaultEnd ?? null);
  const [month, setMonth] = useState(
    monthOf(defaultStart ?? openMonth ?? min ?? `${thisMonth()}-01`),
  );
  const [open, setOpen] = useState(!collapsible);

  /*
   * The same gesture the Dates tab's grid takes (ticket 135), because it is
   * the same grid: press the start and drag to the end, or click the two ends
   * in turn. This one was click-only, so a drag across it was a browser text
   * selection ending in a stray click — and a start with no end yet looked
   * exactly like a picked single day, which is what made the third click read
   * as an undo rather than a fresh start.
   */
  const surface = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  const outside = (date: string) =>
    (min !== undefined && date < min) || (max !== undefined && date > max);

  const halfMade = start !== null && end === null;
  const previewTo = halfMade && !drag && hover && hover > start! ? hover : null;

  const pick = (date: string) => {
    // Start-then-end, and a click before the current start becomes the new
    // start rather than an invalid backwards range — nobody means "end before
    // start", they mean "actually, from here".
    if (start === null || end !== null || date < start) {
      setStart(date);
      setEnd(null);
      return;
    }
    setEnd(date);
  };

  /** A press: picks what a click would, and arms a drag if it opened a window. */
  const startPick = (date: string, e: React.PointerEvent) => {
    // Claim the gesture, or the browser reads it as a text selection.
    e.preventDefault();
    try {
      surface.current?.setPointerCapture(e.pointerId);
    } catch {
      // Pointer already gone. The pick below still stands.
    }
    if (!halfMade) setDrag(date);
    setHover(null);
    pick(date);
  };

  /** The day under the pointer — `pointerenter` never fires once captured. */
  const dateUnder = (e: React.PointerEvent): string | null => {
    const el = document
      .elementFromPoint(e.clientX, e.clientY)
      ?.closest<HTMLElement>("[data-date]");
    const date = el?.dataset.date ?? null;
    // A bounded picker's disabled days stay untakeable by drag too, rather
    // than being swept up by a gesture that passed over them.
    return date && !outside(date) ? date : null;
  };

  const extend = (date: string) => {
    if (!drag) return;
    // Recomputed from the anchor every move, so dragging back over yourself
    // shrinks the window instead of leaving the far end where it was.
    if (date === drag) {
      setStart(drag);
      setEnd(null);
    } else if (date < drag) {
      setStart(date);
      setEnd(drag);
    } else {
      setStart(drag);
      setEnd(date);
    }
  };

  const months = monthsFrom(month, monthCount);
  // While only the start is picked the range is that one day, so the hidden
  // fields are always a valid pair — a half-made selection can't submit a blank
  // end.
  const endValue = end ?? start ?? "";
  const summary = start
    ? `${formatDate(start)}${endValue !== start ? ` – ${formatDate(endValue)}` : ""}`
    : collapsible
      // Closed and empty, this is the only thing standing in for the field, so
      // it says what tapping it does rather than what to do once it's open.
      ? "Add dates"
      : "Pick a day";

  return (
    <div
      ref={surface}
      // The drag lives on the wrapper, not the cells: a touch pointer is
      // implicitly captured by whatever took the `pointerdown`, so cell
      // handlers would only ever hear about the day the finger landed on.
      onPointerMove={(e) => {
        const date = dateUnder(e);
        if (drag) {
          if (date) extend(date);
        } else if (open) {
          setHover(date);
        }
      }}
      onPointerLeave={() => setHover(null)}
      onPointerUp={() => setDrag(null)}
      onPointerCancel={() => setDrag(null)}
    >
      <input type="hidden" name={startName} value={start ?? ""} />
      <input type="hidden" name={endName} value={endValue} />

      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        {collapsible ? (
          <Button
            type="button"
            variant="ghost"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            <span className={start ? "nums" : undefined}>{summary}</span>
          </Button>
        ) : (
          <p className="text-sm text-ink-soft">
            <span className={start ? "nums" : undefined}>{summary}</span>
          </p>
        )}
        {open ? (
          <div className="flex items-center gap-2">
            {/* type="button" throughout: this picker lives inside a form, and a
                bare <button> in one defaults to submit. */}
            <Button
              type="button"
              variant="ghost"
              aria-label="Earlier months"
              onClick={() => setMonth(addMonths(month, -1))}
            >
              ←
            </Button>
            <Button
              type="button"
              variant="ghost"
              aria-label="Later months"
              onClick={() => setMonth(addMonths(month, 1))}
            >
              →
            </Button>
          </div>
        ) : null}
      </div>

      {open ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {months.map((m, i) => (
            // One month on a phone; the arrows page through the rest.
            <div key={m} className={cx(i > 0 && "hidden sm:block")}>
              <p className="typed mb-2">{formatMonth(m)}</p>
              <div
                // The Dates tab's ruled-paper chrome, cell for cell (ticket
                // 129) — one rule under each week, no box around a day, and
                // the cells abutting so a range draws as one stroke.
                // `touch-none` hands the gesture to us — otherwise the browser
                // claims a vertical drag as a page scroll, which is exactly the
                // drag that crosses from one week to the next.
                className="grid touch-none grid-cols-7 border-t border-rule text-center"
                role="grid"
                aria-label={`${formatMonth(m)} dates`}
              >
                {WEEKDAY_LABELS.map((label, i) => (
                  <span
                    key={i}
                    aria-hidden
                    className="pb-1 font-mono text-[10px] uppercase text-ink-faint"
                  >
                    {label}
                  </span>
                ))}
                {monthGrid(m)
                  .flat()
                  .map((date, i) =>
                    date === null ? (
                      // Padding cells carry the rule too, so a week's line
                      // runs the full width instead of stopping short at the
                      // month's ragged ends (ticket 129).
                      <span key={`pad-${i}`} className="border-b border-rule" />
                    ) : (
                      <DayCell
                        key={date}
                        date={date}
                        outside={outside(date)}
                        selected={
                          start !== null && date >= start && date <= endValue
                        }
                        pending={
                          !!previewTo && date > start! && date <= previewTo
                        }
                        openEnd={halfMade && date === start}
                        onStart={(e) => startPick(date, e)}
                        onPick={() => pick(date)}
                      />
                    ),
                  )}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DayCell({
  date,
  outside,
  selected,
  pending,
  openEnd,
  onStart,
  onPick,
}: {
  date: string;
  outside: boolean;
  selected: boolean;
  /** Inside the span the pointer is currently proposing (ticket 135). */
  pending: boolean;
  /** The picked start of a window whose end hasn't been chosen yet. */
  openEnd: boolean;
  onStart: (e: React.PointerEvent) => void;
  onPick: () => void;
}) {
  const dayNumber = Number(date.slice(8, 10));
  return (
    <button
      type="button"
      role="gridcell"
      disabled={outside}
      aria-pressed={selected}
      aria-label={`${date}${outside ? " — outside the trip" : ""}${openEnd ? " — start of the window" : ""}${pending ? " — in the window being picked" : ""}`}
      data-date={date}
      onPointerDown={onStart}
      // Enter and Space arrive as a click with no pointer behind them
      // (`detail === 0`) — the only way this cell is reachable by keyboard,
      // since `pointerdown` never fires there.
      onClick={(e) => {
        if (e.detail === 0) onPick();
      }}
      className={cx(
        "group relative flex aspect-square items-center justify-center border-b border-rule font-mono text-[11px] leading-none transition-colors focus-visible:outline-none",
        // Out of bounds is faint, not boxed and greyed — the grid keeps its
        // shape without a disabled day drawing the eye (ticket 87).
        outside ? "cursor-not-allowed opacity-40" : !selected && "hover:bg-sheet-2",
      )}
    >
      <span
        className={cx(
          "flex h-[70%] w-[70%] items-center justify-center rounded-full transition-colors",
          // The ring goes on the mark: the cell is a full-width square, and a
          // square outline around a round mark is what the global
          // `:focus-visible` gave us (ticket 129).
          "group-focus-visible:ring-2 group-focus-visible:ring-pen group-focus-visible:ring-offset-1 group-focus-visible:ring-offset-sheet",
          // Discrete circles, the Dates tab's marks exactly (ticket 129). A
          // range was briefly one continuous stroke, and a window that wrapped
          // to the next week read as two separate selections.
          selected ? "bg-green font-semibold text-sheet" : "text-ink-soft",
          // The window you'd get if you clicked here: the picked mark at half
          // strength, so the span is drawn before it is made (ticket 135).
          pending && "bg-green/45 font-semibold text-sheet",
          // A start with no end yet, ringed — a lone filled day was
          // indistinguishable from a finished one-day pick.
          openEnd &&
            "ring-2 ring-pen ring-offset-1 ring-offset-sheet",
        )}
      >
        {dayNumber}
      </span>
    </button>
  );
}
