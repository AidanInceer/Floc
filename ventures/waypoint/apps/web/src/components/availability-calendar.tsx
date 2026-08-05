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
 * - **The dates** — the same grid again, used to commit the trip's own window:
 *   first click the start, second the end, a third starts over. It arrived
 *   here in ticket 128 from a pair of native `<input type="date">` boxes in the
 *   card above, whose popover opened on the current month however far off the
 *   trip was. Briefly it was a second grid stacked over this one, which is a
 *   silly thing to do to a page: two near-identical calendars, and you had to
 *   read them to find out which was which. One calendar, three things to look
 *   at it for.
 *
 * Months render several at a time (a group picking "sometime in the spring"
 * shouldn't have to page one month at a time), with paging on top of that.
 */
import { useRef, useState, useTransition } from "react";

import { Button, LegendKey, cx } from "@/components/ui";
import {
  WEEKDAY_LABELS,
  addMonths,
  formatMonth,
  monthGrid,
  monthsFrom,
  type IsoMonth,
} from "@/lib/availability";
import { dateRange, formatDate, today } from "@/lib/dates";

type View = "mine" | "everyone" | "dates";

export function AvailabilityCalendar({
  firstMonth,
  monthCount,
  mine,
  tallies,
  memberCount,
  tripStart,
  tripEnd,
  save,
  saveDates,
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
  /** Commits the trip's window. Null on both ends clears it. */
  saveDates: (start: string | null, end: string | null) => Promise<void>;
}) {
  const [view, setView] = useState<View>("mine");
  const [month, setMonth] = useState(firstMonth);
  const [pending, startTransition] = useTransition();
  const surface = useRef<HTMLDivElement>(null);

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

  /**
   * The trip's window as it is being picked, which starts as whatever is
   * stored. `null` start means nothing is picked; a start with no end is a
   * half-made range that shows as a single day and can't be committed as a
   * pair by accident.
   */
  const [range, setRange] = useState<{ start: string | null; end: string | null }>(
    { start: tripStart, end: tripEnd },
  );
  const rangeEnd = range.end ?? range.start;
  const rangeChanged = range.start !== tripStart || rangeEnd !== tripEnd;

  const pickRange = (date: string) => {
    // A click before the current start means "actually, from here" — nobody
    // means "end before start", which is why this grid needs no `min` to
    // enforce the order the two native boxes couldn't.
    setRange((r) =>
      r.start === null || r.end !== null || date < r.start
        ? { start: date, end: null }
        : { ...r, end: date },
    );
  };

  const stored = new Set(mine);
  const isFree = (date: string) => edits[date] ?? stored.has(date);
  const changed = Object.entries(edits).filter(
    ([date, free]) => free !== stored.has(date),
  );
  const add = changed.filter(([, free]) => free).map(([date]) => date);
  const remove = changed.filter(([, free]) => !free).map(([date]) => date);

  /**
   * Where a drag begins, and the one piece of pointer plumbing this needs
   * (ticket 127).
   *
   * A touch pointer is *implicitly captured* by whichever element took the
   * `pointerdown` — so with the handlers on the cells, every subsequent event
   * went back to the day the finger landed on and no other cell ever heard
   * `pointerenter`. On a phone the drag painted exactly one day. Moving the
   * capture up to the whole calendar fixes both halves at once: the moves keep
   * arriving (at the surface, which hit-tests for the cell under the finger),
   * and so does the `pointerup`, wherever the finger ends up — including off
   * the grid entirely, which is what `onPointerLeave` used to be there to
   * catch.
   */
  const startPaint = (date: string, e: React.PointerEvent) => {
    // Claim the gesture before the browser reads it as a text selection or,
    // on touch, as a scroll.
    e.preventDefault();
    try {
      surface.current?.setPointerCapture(e.pointerId);
    } catch {
      // The pointer went away between the event and this line. Nothing to
      // capture, and the drag is about to be cancelled anyway — never let it
      // take the paint down with it.
    }
    const target = !isFree(date);
    setDrag({ anchor: date, target, base: edits });
    setEdits({ ...edits, [date]: target });
  };

  /** The day under the pointer, wherever it is — `pointerenter` can't say. */
  const dateUnder = (e: React.PointerEvent): string | null => {
    const el = document
      .elementFromPoint(e.clientX, e.clientY)
      ?.closest<HTMLElement>("[data-date]");
    return el?.dataset.date ?? null;
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

  const onSaveDates = () =>
    startTransition(async () => {
      await saveDates(range.start, rangeEnd);
    });

  const months = monthsFrom(month, monthCount);
  const now = today();

  return (
    <div
      ref={surface}
      // The drag lives here rather than on the cells — see `startPaint`. The
      // pointer is captured to this element, so every move and the release all
      // come here whatever they happen to be over.
      onPointerMove={(e) => {
        if (!drag) return;
        const date = dateUnder(e);
        if (date) extendPaint(date);
      }}
      onPointerUp={() => setDrag(null)}
      onPointerCancel={() => setDrag(null)}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex overflow-hidden rounded-md border border-rule-strong">
          {(["mine", "everyone", "dates"] as const).map((v) => (
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
              {v === "mine" ? "Mine" : v === "everyone" ? "Everyone" : "The dates"}
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
              // `touch-none` hands the whole gesture to us: without it the
              // browser claims a vertical drag as a page scroll, which is
              // exactly the drag that crosses from one week's row to the next
              // (ticket 127). A tap still toggles, and the page still scrolls
              // from anywhere that isn't the grid.
              className="grid touch-none grid-cols-7 gap-px text-center"
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
                    inRange={
                      view === "dates" &&
                      range.start !== null &&
                      !!rangeEnd &&
                      date >= range.start &&
                      date <= rangeEnd
                    }
                    onStart={(e) =>
                      view === "dates" ? pickRange(date) : startPaint(date, e)
                    }
                    onToggle={() =>
                      view === "dates"
                        ? pickRange(date)
                        : setEdits({ ...edits, [date]: !isFree(date) })
                    }
                  />
                ),
              )}
            </div>
          </div>
        ))}
      </div>

      {view === "dates" ? (
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-rule pt-4">
          <p className="text-sm text-ink-soft">
            {range.start ? (
              <span className="nums">
                {formatDate(range.start)}
                {rangeEnd !== range.start ? ` – ${formatDate(rangeEnd)}` : ""}
              </span>
            ) : (
              "Pick the first day"
            )}
          </p>
          <Button
            variant="primary"
            disabled={!range.start || !rangeChanged || pending}
            onClick={onSaveDates}
          >
            {pending ? "Setting…" : tripStart ? "Change dates" : "Set the dates"}
          </Button>
          {rangeChanged ? (
            <Button
              variant="ghost"
              onClick={() => setRange({ start: tripStart, end: tripEnd })}
            >
              Discard
            </Button>
          ) : null}
        </div>
      ) : view === "mine" ? (
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
  inRange,
  onStart,
  onToggle,
}: {
  date: string;
  view: View;
  free: boolean;
  tally: number;
  memberCount: number;
  past: boolean;
  inTrip: boolean;
  /** Inside the window being picked, in the dates view. */
  inRange: boolean;
  onStart: (e: React.PointerEvent) => void;
  onToggle: () => void;
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

  /*
   * Two things one cell can be showing (ticket 128). Painting your own
   * availability, a day is on or off by itself and reads as a mark. Picking the
   * trip's window, the same cell belongs to a *span*, so it takes the pen fill
   * rather than the green one — the group's free days and the group's decision
   * are different claims and mustn't look alike on the same grid.
   */
  const picking = view === "dates";
  const marked = picking ? inRange : free;

  return (
    <button
      type="button"
      role="gridcell"
      aria-pressed={marked}
      aria-label={
        picking
          ? `${date}${inRange ? " — in the trip" : ""}`
          : `${date}${free ? " — you're free" : ""}`
      }
      // What the surface above hit-tests for on every move — the cell under
      // the pointer, which `pointerenter` is no help with on touch.
      data-date={date}
      onPointerDown={onStart}
      // Enter and Space arrive as a click with no pointer behind it
      // (`detail === 0`), which is the only way this cell is reachable from
      // the keyboard — `pointerdown` never fires there.
      onClick={(e) => {
        if (e.detail === 0) onToggle();
      }}
      className={cx(
        "flex aspect-square items-center justify-center rounded-sm border font-mono text-[11px] leading-none transition-colors",
        marked
          ? picking
            ? "border-pen bg-pen-soft font-semibold text-pen"
            : "border-green bg-green-soft font-semibold text-green"
          : "border-rule bg-sheet text-ink-soft hover:bg-sheet-2",
        // The stored window, as a reminder of what you're changing — but not
        // over a cell already carrying the pick.
        inTrip && !marked && "border-pen",
        past && "opacity-45",
      )}
    >
      {dayNumber}
    </button>
  );
}
