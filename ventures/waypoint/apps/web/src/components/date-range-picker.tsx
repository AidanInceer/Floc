"use client";

/**
 * A start/end date pair picked off a month grid (ticket 87), for the Route
 * tab's stop forms. Two plain `<input type="date">` boxes made you type a stop
 * into a trip you were already looking at, and the native picker offered every
 * date there has ever been — including the ones outside the trip.
 *
 * The grid is the Dates tab's grid on purpose (`availability-calendar.tsx`):
 * same cell, same weekday header, same paging, so a stop's dates are chosen
 * the way the trip's dates were. It is a *range* picker rather than a paint
 * surface, so the interaction differs: first click sets the start, second sets
 * the end, a third starts over.
 *
 * Days outside `min`/`max` render disabled rather than being dropped, so the
 * grid keeps its shape and a month at the edge of the trip doesn't reflow
 * (ticket 87). The real values travel in hidden inputs, so the surrounding
 * server action sees exactly the same `startDate`/`endDate` fields it did when
 * these were date inputs.
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
} from "@/lib/availability";
import { formatDate } from "@/lib/dates";

export function DateRangePicker({
  startName,
  endName,
  min,
  max,
  defaultStart,
  defaultEnd,
  /** How many months to show at once. The trip window is usually one or two. */
  monthCount = 2,
}: {
  startName: string;
  endName: string;
  /** First selectable date — the trip's start. */
  min: string;
  /** Last selectable date — the trip's end. */
  max: string;
  defaultStart?: string;
  defaultEnd?: string;
  monthCount?: number;
}) {
  const [start, setStart] = useState<string | null>(defaultStart ?? null);
  const [end, setEnd] = useState<string | null>(defaultEnd ?? null);
  const [month, setMonth] = useState(monthOf(defaultStart ?? min));

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

  return (
    <div>
      <input type="hidden" name={startName} value={start ?? ""} />
      <input type="hidden" name={endName} value={endValue} />

      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-ink-soft">
          {start ? (
            <span className="nums">
              {formatDate(start)}
              {endValue !== start ? ` – ${formatDate(endValue)}` : ""}
            </span>
          ) : (
            "Pick a day"
          )}
        </p>
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
      </div>

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
                      outside={date < min || date > max}
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
