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
import { dateRange, today } from "@/lib/dates";

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

  /*
   * One footer shape for all three views. They hold different things — a save
   * button, a key, a range and its buttons — and letting each size itself
   * moved the card's bottom edge every time you switched view, which made a
   * switch between two views of the same grid look like a change of page.
   *
   * It reserves *two* rows (ticket 133), not one. The dates view carries a
   * range, two buttons and a three-word key, which wraps onto a second line at
   * anything short of a wide desktop — so a one-row reservation held for Mine
   * and Everyone and then jumped 24px on the third view. Two rows is what the
   * busiest view needs, and the other two sit in the same box with air under
   * them rather than moving the card's bottom edge.
   */
  const footer =
    "mt-5 flex min-h-[calc(2rem+0.5rem+2rem+1rem+1px)] flex-wrap content-start items-center gap-x-4 gap-y-2 border-t border-rule pt-4";

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
      {/* One row at every width (ticket 134): wrapping put the two arrows on
          a line of their own, hard left under the middle of the switch, which
          read as a stray pair of controls belonging to nothing. */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="inline-flex shrink-0 overflow-hidden rounded-md border border-rule-strong">
          {(["mine", "everyone", "dates"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={cx(
                // `whitespace-nowrap` and a tighter phone padding: the switch
                // has to survive being squeezed next to the arrows rather
                // than breaking "The dates" over two lines.
                "whitespace-nowrap px-2 py-1 font-mono text-[11px] uppercase tracking-[0.06em] transition-colors sm:px-3",
                view === v
                  ? "bg-pen text-sheet"
                  : "bg-sheet text-ink-soft hover:bg-sheet-2",
              )}
            >
              {v === "mine" ? "Mine" : v === "everyone" ? "Everyone" : "The dates"}
            </button>
          ))}
        </div>

        {/* The arrows give up the width, not the switch: a squeezed switch
            clipped "The dates" to "The date" on a phone. */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            className="!px-2"
            aria-label="Earlier months"
            onClick={() => setMonth(addMonths(month, -1))}
          >
            ←
          </Button>
          <Button
            variant="ghost"
            className="!px-2"
            aria-label="Later months"
            onClick={() => setMonth(addMonths(month, 1))}
          >
            →
          </Button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {months.map((m, i) => (
          /*
           * Never more than one row of months (ticket 132). The columns come
           * from the width — one, then two, then three — and a month past what
           * fits doesn't wrap onto a second row, it waits: a calendar you have
           * to scroll down to finish reading isn't one you can compare across.
           * The arrows page through whatever isn't showing, so nothing is out
           * of reach.
           */
          <div
            key={m}
            // One class per slot, not stacked conditions: `sm:block` and
            // `lg:block` on the same element both win at wide sizes, so the
            // third month has to be `hidden lg:block` and nothing else.
            className={
              i === 0
                ? undefined
                : i === 1
                  ? "hidden sm:block"
                  : i === 2
                    ? "hidden lg:block"
                    : "hidden"
            }
          >
            <p className="typed mb-2">{formatMonth(m)}</p>
            <div
              // `touch-none` hands the whole gesture to us: without it the
              // browser claims a vertical drag as a page scroll, which is
              // exactly the drag that crosses from one week's row to the next
              // (ticket 127). A tap still toggles, and the page still scrolls
              // from anywhere that isn't the grid.
              // Ruled paper, not a grid of boxes (ticket 129). One rule under
              // each week and none between the days, so the month reads as
              // lines on a page — and the cells abut, which is what lets a
              // picked range draw as one continuous stroke rather than seven
              // separate fills.
              className="grid touch-none grid-cols-7 border-t border-rule text-center"
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
                  <span key={`pad-${i}`} className="border-b border-rule" />
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
                    isToday={date === now}
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
        <div className={footer}>
          {/* No line of text restating the pick (ticket 134). Empty it read
              "Pick the first day", which is instructions; full it repeated
              the run of green circles directly above it, and the committed
              window is already the page's subtitle. */}
          <Button
            variant="primary"
            disabled={!range.start || !rangeChanged || pending}
            onClick={onSaveDates}
          >
            {pending ? "Setting…" : tripStart ? "Change dates" : "Set the dates"}
          </Button>
          {/* Always here, disabled when there is nothing to throw away
              (ticket 133). Appearing and disappearing changed how much of
              the footer was left for the key, which re-wrapped it onto a
              second line — so committing the dates moved the card's bottom
              edge by a row. */}
          <Button
            variant="ghost"
            disabled={!rangeChanged}
            onClick={() => setRange({ start: tripStart, end: tripEnd })}
          >
            Discard
          </Button>
          {/* The same key as the Everyone view, because this view draws the
              same marks — a colour that appears has to be readable where it
              appears, not one tab away — plus the one mark only this view has.
              With the per-day counts gone, the key is what carries the words
              (CLAUDE.md: status is never colour alone); each cell also names
              its tally in its `title` and its accessible label. */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <LegendKey swatch="bg-green border-green" label="The trip" />
            <LegendKey swatch="bg-green-soft border-green" label="All free" />
            <LegendKey swatch="bg-red-soft border-red" label="Some missing" />
          </div>
        </div>
      ) : view === "mine" ? (
        <div className={footer}>
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
          <Button
            variant="ghost"
            disabled={changed.length === 0}
            onClick={() => setEdits({})}
          >
            Discard
          </Button>
        </div>
      ) : (
        /* A key, not a paragraph (ticket 76). The swatch carries the colour and
           the label carries the meaning, so the reader matches rather than
           reads — the first instance of the visual-over-text convention. */
        <div className={footer}>
          <LegendKey swatch="bg-green-soft border-green" label="All free" />
          <LegendKey swatch="bg-red-soft border-red" label="Some missing" />
          <LegendKey swatch="bg-sheet-2 border-rule" label="No answer yet" />
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
  isToday,
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
  isToday: boolean;
  onStart: (e: React.PointerEvent) => void;
  onToggle: () => void;
}) {
  const dayNumber = Number(date.slice(8, 10));

  /*
   * The chrome every cell shares (ticket 129): one rule under the week, no
   * box around the day. A month is lines on a page, and the marks are what
   * sits on them.
   */
  const cell =
    "relative flex aspect-square flex-col items-center justify-center border-b border-rule font-mono text-[11px] leading-none";

  /*
   * The focus ring belongs to the mark, not to the cell (ticket 129). The
   * global `:focus-visible` outline is a square, and the cell is a square the
   * full width of the column — so clicking a day (or shift-clicking, which is
   * what made it obvious) drew a blue box around a round green mark. The
   * button drops the outline and the circle takes a ring instead.
   */
  const focusRing =
    "group-focus-visible:ring-2 group-focus-visible:ring-pen group-focus-visible:ring-offset-1 group-focus-visible:ring-offset-sheet";

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
   * Each day used to carry its tally as a small number under the mark. It sat
   * on every answered day in the month and read as texture rather than as
   * data (ticket 129) — the key below says what the two washes mean, and the
   * exact count is on the cell's `title` and its accessible label for anyone
   * who wants the number rather than the shape.
   */
  const groupMark =
    tally === 0
      ? "text-ink-faint"
      : tally === memberCount
        ? "bg-green-soft text-green"
        : "bg-red-soft text-red";

  if (view === "everyone") {
    return (
      <span
        role="gridcell"
        title={`${date} — ${tally} of ${memberCount} free`}
        className={cx(cell, past && "opacity-45")}
      >
        <span
          className={cx(
            "flex h-[70%] w-[70%] items-center justify-center rounded-full",
            inTrip ? "bg-green font-semibold text-sheet" : groupMark,
          )}
        >
          {dayNumber}
        </span>
      </span>
    );
  }

  /*
   * Two things one cell can be showing (ticket 128). Painting your own
   * availability, a day is on or off by itself. Picking the trip's window, the
   * cell shows the *group's* answer — the same washes the Everyone view
   * draws — because choosing a week is a decision about who can make it, and
   * the view that commits the dates shouldn't be the one that hides that.
   *
   * A day that is in the window overrides the wash with the solid green: the
   * decision outranks the thing it was decided from, and it's the same green,
   * pressed harder. Marks stay discrete circles throughout — a range was
   * briefly drawn as one continuous stroke, which made a window that wrapped
   * to the next week look like two separate selections (ticket 129).
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
          ? `${date} — ${tally} of ${memberCount} free${inRange ? ", in the trip" : ""}`
          : `${date}${free ? " — you're free" : ""}`
      }
      title={picking ? `${date} — ${tally} of ${memberCount} free` : undefined}
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
        cell,
        "group transition-colors focus-visible:outline-none",
        past && "opacity-45",
      )}
    >
      <span
        className={cx(
          "flex h-[70%] w-[70%] items-center justify-center rounded-full transition-colors",
          focusRing,
          // Picking: the group's answer, with the chosen days pressed into
          // the solid green over the top of it.
          picking && (inRange ? "bg-green font-semibold text-sheet" : groupMark),
          // A free day is a pen mark on the page — round, filled, sitting on
          // the rule — not a filled-in box (ticket 129). Several of them read
          // as several marks, which is what they are.
          !picking && free && "bg-green-soft font-semibold text-green ring-1 ring-green",
          !picking && !free && "text-ink-soft",
          // Today is circled, the way you'd circle it.
          isToday && !free && !inRange && "ring-1 ring-pen",
        )}
      >
        {dayNumber}
      </span>
    </button>
  );
}
