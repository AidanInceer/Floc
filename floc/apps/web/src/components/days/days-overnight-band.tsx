"use client";

/**
 * The overnight band row (ticket 141; split out under 243): press a day for the
 * dialog, drag across days for the dialog on that span, drag a bar's end to
 * grow/shrink the run on release. All three fall back to the dialog for
 * keyboard/phone. Draws and forwards gestures; the rules live with the caller.
 */
import { type CSSProperties, type PointerEvent as ReactPointerEvent, type RefObject } from "react";

import { cx } from "@/components/system/ui";
import {
  OUTSIDE_DAY_CLASS,
  describeSpan,
  type BandDrag,
  type CalendarDay,
} from "@/components/days/days-calendar-shared";
import { runBoundsAt, type BandRun, type BandSpan } from "@floc/core/itinerary/overnight-band";

export function OvernightBandRow({
  bandRuns,
  days,
  rowStyle,
  rowRef,
  onPointerMove,
  onPointerUp,
  startBandDrag,
  openBandDialog,
  columnAt,
  dateOfDay,
}: {
  bandRuns: BandRun<CalendarDay>[];
  days: CalendarDay[];
  rowStyle: CSSProperties;
  rowRef: RefObject<HTMLDivElement | null>;
  onPointerMove: (ev: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: () => void;
  startBandDrag: (ev: ReactPointerEvent<HTMLElement>, drag: BandDrag) => void;
  openBandDialog: (span: BandSpan) => void;
  columnAt: (x: number) => { dayId: number; top: number } | null;
  dateOfDay: (dayId: number) => string | null;
}) {
  return (
    <div
      ref={rowRef}
      style={rowStyle}
      // `select-none`: without it, dragging along the band selects text.
      className="select-none border-b border-rule bg-sheet"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Not `.typed`: at 11px it ran under the rule, wider than the clock
          column it shares. Same mono face, sized for "00:00". */}
      <div className="sticky left-0 z-20 flex items-center justify-end border-r border-rule bg-sheet px-1.5 py-1.5">
        <span className="font-mono text-[9px] uppercase tracking-[0.02em] text-ink-faint">
          Overnight
        </span>
      </div>

      {bandRuns.map((run) => (
        <BandCell
          key={run.days[0].date}
          run={run}
          days={days}
          startBandDrag={startBandDrag}
          openBandDialog={openBandDialog}
          columnAt={columnAt}
          dateOfDay={dateOfDay}
        />
      ))}
    </div>
  );
}

function BandCell({
  run,
  days,
  startBandDrag,
  openBandDialog,
  columnAt,
  dateOfDay,
}: {
  run: BandRun<CalendarDay>;
  days: CalendarDay[];
  startBandDrag: (ev: ReactPointerEvent<HTMLElement>, drag: BandDrag) => void;
  openBandDialog: (span: BandSpan) => void;
  columnAt: (x: number) => { dayId: number; top: number } | null;
  dateOfDay: (dayId: number) => string | null;
}) {
  const first = run.days[0];
  const last = run.days[run.days.length - 1];
  const cell: CSSProperties = { gridColumn: `span ${run.days.length}` };

  // A padding day has no `day` row to write to, so its band cell is scenery —
  // the same silence the column below it keeps.
  if (first.outside) {
    return <div aria-hidden style={cell} className={cx("h-9 border-l border-rule", OUTSIDE_DAY_CLASS)} />;
  }

  const bounds = runBoundsAt(days, first.date, run.placeId);
  const dragFrom = (
    ev: ReactPointerEvent<HTMLElement>,
    from: { anchorDate: string; pressedDate: string; whole: boolean },
  ): BandDrag => ({
    mode: run.placeId === null ? "paint" : "extend",
    anchorDate: from.anchorDate,
    pressedDate: from.pressedDate,
    placeId: run.placeId,
    placeName: run.placeName,
    // Only a handle can shrink a run, so only a handle carries the run's true
    // extent; a press in the middle paints outward from where it started and
    // leaves the rest of the stay alone.
    runStart: from.whole ? bounds.start : from.pressedDate,
    runEnd: from.whole ? bounds.end : from.pressedDate,
    startX: ev.clientX,
    moved: false,
    span: null,
  });

  if (run.placeId === null && !run.preview) {
    return (
      <div style={cell} className="border-l border-rule p-1">
        <button
          type="button"
          aria-label={`Overnight place for ${first.longLabel} — not set`}
          onPointerDown={(ev) =>
            startBandDrag(ev, dragFrom(ev, { anchorDate: first.date, pressedDate: first.date, whole: false }))
          }
          onClick={(ev) => {
            // Only the keyboard's click gets here: a pointer's goes to the row,
            // which holds the capture.
            if (ev.detail === 0) {
              openBandDialog({ start: first.date, end: first.date, placeId: null, placeName: null });
            }
          }}
          // `block`, not default inline-block: the line's descender space made
          // an empty day 7px taller than one with a bar.
          className="block h-7 w-full rounded-full border border-dashed border-rule transition-colors hover:border-pen hover:bg-pen-soft"
        />
      </div>
    );
  }

  return (
    <div style={cell} className="relative border-l border-rule p-1">
      <button
        type="button"
        aria-label={
          run.placeName
            ? `${run.placeName}, ${describeSpan(days, { start: bounds.start, end: bounds.end })}`
            : `Overnight place for ${describeSpan(days, { start: first.date, end: last.date })}`
        }
        onPointerDown={(ev) => {
          const pressed = dateOfDay(columnAt(ev.clientX)?.dayId ?? -1);
          startBandDrag(
            ev,
            dragFrom(ev, { anchorDate: pressed ?? first.date, pressedDate: pressed ?? first.date, whole: false }),
          );
        }}
        onClick={(ev) => {
          // The keyboard has no day under it, so it addresses the run it has
          // focus on — which is also what lets a keyboard do what the handles do.
          if (ev.detail === 0) {
            openBandDialog({ start: first.date, end: last.date, placeId: run.placeId, placeName: run.placeName });
          }
        }}
        className={cx(
          "flex h-7 w-full items-center truncate rounded-full border px-2 text-xs transition-colors",
          // Pen blue, not highlighter yellow — yellow is the food category's
          // colour. `-edge` dissolves into the sheet (ticket 73).
          run.preview
            ? "justify-center border-dashed border-pen bg-pen-soft text-pen-deep"
            : "border-pen-edge bg-pen-soft text-pen hover:border-pen",
          run.openStart && "rounded-l-none",
          run.openEnd && "rounded-r-none",
        )}
      >
        {run.placeName}
      </button>

      {!run.preview && run.placeId !== null ? (
        <BandHandles run={run} bounds={bounds} startBandDrag={startBandDrag} dragFrom={dragFrom} />
      ) : null}
    </div>
  );
}

// Both ends grabbable — a bar with one live end teaches nothing about why.
// Hidden from keyboard users, who have the dialog's last-day field instead.
function BandHandles({
  run,
  bounds,
  startBandDrag,
  dragFrom,
}: {
  run: BandRun<CalendarDay>;
  bounds: { start: string; end: string };
  startBandDrag: (ev: ReactPointerEvent<HTMLElement>, drag: BandDrag) => void;
  dragFrom: (
    ev: ReactPointerEvent<HTMLElement>,
    from: { anchorDate: string; pressedDate: string; whole: boolean },
  ) => BandDrag;
}) {
  const first = run.days[0];
  const last = run.days[run.days.length - 1];
  return (
    <>
      {(
        [
          // The anchor is the run's *true* far end, which may be on another page
          // — a handle must not silently crop the half of the stay you can't see.
          ["start", !run.openStart, bounds.end, "left-0.5"],
          ["end", !run.openEnd, bounds.start, "right-0.5"],
        ] as const
      )
        .filter(([, live]) => live)
        .map(([edge, , anchorDate, side]) => (
          <span
            key={edge}
            aria-hidden
            onPointerDown={(ev) => {
              ev.stopPropagation();
              startBandDrag(
                ev,
                dragFrom(ev, {
                  anchorDate,
                  pressedDate: edge === "start" ? first.date : last.date,
                  whole: true,
                }),
              );
            }}
            className={cx("absolute inset-y-1 w-2 cursor-ew-resize", side)}
          >
            <span
              className={cx(
                "absolute top-1/2 h-[14px] w-[2px] -translate-y-1/2 rounded-full bg-pen opacity-60",
                edge === "start" ? "left-[2px]" : "right-[2px]",
              )}
            />
          </span>
        ))}
    </>
  );
}
