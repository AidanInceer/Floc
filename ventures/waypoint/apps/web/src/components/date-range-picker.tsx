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
 * So: one grid, no native popover left in the app. First click sets the start,
 * second sets the end, a third starts over — the end can't precede the start
 * because there is nowhere to say so, which is a stronger guarantee than a
 * `min` attribute. The grid is the Dates tab's own grid (`availability-
 * calendar.tsx`): same cell, same weekday header, same paging, so a stop's
 * dates are chosen the way the trip's dates were.
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
import { useState } from "react";

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
    <div>
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
          {months.map((m) => (
            <div key={m}>
              <p className="typed mb-2">{formatMonth(m)}</p>
              <div
                className="grid grid-cols-7 gap-px text-center"
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
                      <span key={`pad-${i}`} />
                    ) : (
                      <DayCell
                        key={date}
                        date={date}
                        outside={
                          (min !== undefined && date < min) ||
                          (max !== undefined && date > max)
                        }
                        selected={
                          start !== null && date >= start && date <= endValue
                        }
                        edge={date === start || date === endValue}
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
  edge,
  onPick,
}: {
  date: string;
  outside: boolean;
  selected: boolean;
  edge: boolean;
  onPick: () => void;
}) {
  const dayNumber = Number(date.slice(8, 10));
  return (
    <button
      type="button"
      role="gridcell"
      disabled={outside}
      aria-pressed={selected}
      aria-label={`${date}${outside ? " — outside the trip" : ""}`}
      onClick={onPick}
      className={cx(
        "flex aspect-square items-center justify-center rounded-sm border font-mono text-[11px] leading-none transition-colors",
        outside
          ? "cursor-not-allowed border-transparent bg-sheet-2 text-ink-faint opacity-45"
          : selected
            ? "border-green bg-green-soft text-green"
            : "border-rule bg-sheet text-ink-soft hover:bg-sheet-2",
        edge && "font-semibold",
      )}
    >
      {dayNumber}
    </button>
  );
}
