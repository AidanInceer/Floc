"use client";

/**
 * The Dates tab's calendar. Two views over the same grid:
 *
 * - **Mine** — a month calendar you paint your own free days onto. Click a day
 *   to toggle it, or drag across several. Nothing is written until you save:
 *   one server action per editing session, not one per day, because painting a
 *   fortnight is fourteen taps and fourteen round trips would make the whole
 *   thing feel broken.
 * - **Everyone** — the same grid, read-only, each day showing how many of the
 *   group are free. Shaded by agreement (ticket 67): green when the whole group
 *   is free, red when the day would leave somebody out, unshaded when nobody
 *   has answered. Shaded *and* numbered: colour is never the only signal.
 *
 * Months render several at a time (a group picking "sometime in the spring"
 * shouldn't have to page one month at a time), with paging on top of that.
 */
import { useState, useTransition } from "react";

import { Button, LegendKey, cx } from "@/components/ui";
import {
  WEEKDAY_LABELS,
  addMonths,
  formatMonth,
  monthGrid,
  monthsFrom,
  type IsoMonth,
} from "@/lib/availability";
import { dateRange, today } from "@/lib/dates";

type View = "mine" | "everyone";

export function AvailabilityCalendar({
  firstMonth,
  monthCount,
  mine,
  tallies,
  memberCount,
  tripStart,
  tripEnd,
  save,
}: {
  firstMonth: IsoMonth;
  monthCount: number;
  /** The viewer's own free dates, as stored. */
  mine: string[];
  /** date → how many members are free. Includes the viewer. */
  tallies: Record<string, number>;
  memberCount: number;
  tripStart: string | null;
  tripEnd: string | null;
  save: (add: string[], remove: string[]) => Promise<void>;
}) {
  const [view, setView] = useState<View>("mine");
  const [month, setMonth] = useState(firstMonth);
  const [pending, startTransition] = useTransition();

  // Local truth while editing: date → free?. Only dates the viewer has touched
  // appear here, so an untouched day always falls through to the server's copy
  // and a concurrent edit by someone else isn't silently reverted.
  const [edits, setEdits] = useState<Record<string, boolean>>({});
  /**
   * A drag paints the whole span from where it started to wherever the pointer
   * is now, recomputed from `base` on every move — not just the cell under the
   * pointer. A fast drag doesn't fire `pointerenter` on every cell it crosses,
   * so painting cell-by-cell leaves holes in the middle of a selected week;
   * recomputing the span also means dragging back over yourself un-paints.
   */
  const [drag, setDrag] = useState<{
    anchor: string;
    target: boolean;
    base: Record<string, boolean>;
  } | null>(null);

  const stored = new Set(mine);
  const isFree = (date: string) => edits[date] ?? stored.has(date);
  const changed = Object.entries(edits).filter(
    ([date, free]) => free !== stored.has(date),
  );
  const add = changed.filter(([, free]) => free).map(([date]) => date);
  const remove = changed.filter(([, free]) => !free).map(([date]) => date);

  const startPaint = (date: string) => {
    const target = !isFree(date);
    setDrag({ anchor: date, target, base: edits });
    setEdits({ ...edits, [date]: target });
  };

  const extendPaint = (date: string) => {
    if (!drag) return;
    const span = dateRange(
      drag.anchor <= date ? drag.anchor : date,
      drag.anchor <= date ? date : drag.anchor,
    );
    const next = { ...drag.base };
    for (const d of span) next[d] = drag.target;
    setEdits(next);
  };

  const onSave = () =>
    startTransition(async () => {
      await save(add, remove);
      setEdits({});
    });

  const months = monthsFrom(month, monthCount);
  const now = today();

  return (
    <div
      // Painting ends wherever the pointer is released, including outside the
      // grid — otherwise letting go over the page margin leaves it stuck on.
      onPointerUp={() => setDrag(null)}
      onPointerLeave={() => setDrag(null)}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex overflow-hidden rounded-md border border-rule-strong">
          {(["mine", "everyone"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={cx(
                "px-3 py-1 font-mono text-[11px] uppercase tracking-[0.06em] transition-colors",
                view === v
                  ? "bg-pen text-sheet"
                  : "bg-sheet text-ink-soft hover:bg-sheet-2",
              )}
            >
              {v === "mine" ? "Mine" : "Everyone"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            aria-label="Earlier months"
            onClick={() => setMonth(addMonths(month, -1))}
          >
            ←
          </Button>
          <Button
            variant="ghost"
            aria-label="Later months"
            onClick={() => setMonth(addMonths(month, 1))}
          >
            →
          </Button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {months.map((m) => (
          <div key={m}>
            <p className="typed mb-2">{formatMonth(m)}</p>
            <div
              className="grid grid-cols-7 gap-px text-center"
              role="grid"
              aria-label={`${formatMonth(m)} availability`}
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
              {monthGrid(m).flat().map((date, i) =>
                date === null ? (
                  <span key={`pad-${i}`} />
                ) : (
                  <DayCell
                    key={date}
                    date={date}
                    view={view}
                    free={isFree(date)}
                    tally={tallies[date] ?? 0}
                    memberCount={memberCount}
                    past={date < now}
                    inTrip={
                      !!tripStart && !!tripEnd && date >= tripStart && date <= tripEnd
                    }
                    onStart={() => startPaint(date)}
                    onEnter={() => extendPaint(date)}
                  />
                ),
              )}
            </div>
          </div>
        ))}
      </div>

      {view === "mine" ? (
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-rule pt-4">
          <Button
            variant="primary"
            disabled={changed.length === 0 || pending}
            onClick={onSave}
          >
            {pending
              ? "Saving…"
              : changed.length === 0
                ? "Nothing to save"
                : `Save ${changed.length} ${changed.length === 1 ? "day" : "days"}`}
          </Button>
          {changed.length > 0 ? (
            <Button variant="ghost" onClick={() => setEdits({})}>
              Discard
            </Button>
          ) : null}
        </div>
      ) : (
        /* A key, not a paragraph (ticket 76). The swatch carries the colour and
           the label carries the meaning, so the reader matches rather than
           reads — the first instance of the visual-over-text convention. */
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-rule pt-4">
          <LegendKey swatch="bg-green-soft border-green" label="All free" />
          <LegendKey swatch="bg-red-soft border-red" label="Some missing" />
          <LegendKey swatch="bg-sheet-2 border-rule" label="No answer yet" />
          <p className="text-xs text-ink-faint">
            {/* Not "how many of the {n} of you", which reads as nonsense on a
                trip of one. */}
            Numbers count how many are free, out of {memberCount}.
          </p>
        </div>
      )}
    </div>
  );
}

/** One swatch-and-word pair in the Dates key (ticket 76). */
function DayCell({
  date,
  view,
  free,
  tally,
  memberCount,
  past,
  inTrip,
  onStart,
  onEnter,
}: {
  date: string;
  view: View;
  free: boolean;
  tally: number;
  memberCount: number;
  past: boolean;
  inTrip: boolean;
  onStart: () => void;
  onEnter: () => void;
}) {
  const dayNumber = Number(date.slice(8, 10));

  if (view === "everyone") {
    /*
     * Three states, not a ramp (ticket 67). It used to shade in four bands —
     * everyone / most / some / nobody — and the two middle bands were the
     * problem: a day half the group can't do and a day one person can't do
     * looked meaningfully different when they aren't. Either the whole group is
     * free or the day costs somebody, so:
     *
     *   everyone free  → green wash, the same "agreed" green as everywhere else
     *   some free      → red wash, i.e. this one leaves people out
     *   nobody yet     → the plain sheet, because no answer is not a bad answer
     *
     * The count under the number is what actually says *how many*, so the red
     * is a prompt to look rather than the whole message (CLAUDE.md: status is
     * never colour alone).
     */
    const band =
      tally === 0
        ? "bg-sheet-2 text-ink-faint"
        : tally === memberCount
          ? "bg-green-soft text-green"
          : "bg-red-soft text-red";
    return (
      <span
        role="gridcell"
        title={`${date} — ${tally} of ${memberCount} free`}
        className={cx(
          "flex aspect-square flex-col items-center justify-center rounded-sm border font-mono text-[11px] leading-none",
          band,
          inTrip ? "border-pen" : "border-transparent",
          past && "opacity-45",
        )}
      >
        <span>{dayNumber}</span>
        {tally > 0 ? (
          <span className="mt-0.5 text-[9px] opacity-80">{tally}</span>
        ) : null}
      </span>
    );
  }

  return (
    <button
      type="button"
      role="gridcell"
      aria-pressed={free}
      aria-label={`${date}${free ? " — you're free" : ""}`}
      onPointerDown={(e) => {
        // Claim the pointer so dragging across cells keeps firing enter events
        // instead of the browser starting a text selection.
        e.preventDefault();
        onStart();
      }}
      onPointerEnter={onEnter}
      className={cx(
        "flex aspect-square items-center justify-center rounded-sm border font-mono text-[11px] leading-none transition-colors",
        free
          ? "border-green bg-green-soft font-semibold text-green"
          : "border-rule bg-sheet text-ink-soft hover:bg-sheet-2",
        inTrip && !free && "border-pen",
        past && "opacity-45",
      )}
    >
      {dayNumber}
    </button>
  );
}
