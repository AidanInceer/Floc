"use client";

/**
 * One day's slice of the clock (ticket 243, split from `days-calendar`): the
 * painted rules, the catcher that turns a click into a quarter hour, and the
 * blocks. Draws and forwards pointer/keyboard gestures — the rules for what
 * they mean live in `lib/calendar-gestures.ts`.
 */
import { useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";

import { cx } from "@/components/system/ui";
import {
  HOUR_PX,
  OUTSIDE_DAY_CLASS,
  type CalendarDay,
  type CalendarEvent,
  type Landing,
} from "@/components/days/days-calendar-shared";
import { clamp, formatSpan, packLanes, snap, spanOf, toHhmm, toMinutes } from "@floc/core/dates/calendar";
import { EVENT_CATEGORIES } from "@floc/core/itinerary/event-categories";

// Packing decides *where* a block goes, not render order — rendering in
// `packLanes`' start-sorted order re-sorted the keyed nodes on drag, and Chrome
// drops pointer capture on a node taken out of the tree and put back. Fixed
// order by id, with `top`/`left` doing the moving, avoids that.
function packColumn(events: CalendarEvent[]) {
  return packLanes(
    events.flatMap((e) => {
      const span = spanOf(e);
      return span ? [{ id: e.id, start: span.start, end: span.end }] : [];
    }),
  ).sort((a, b) => a.id - b.id);
}

export function DayColumn({
  day,
  height,
  events,
  selected,
  landing,
  nowMinutes,
  minutesToY,
  yToMinutes,
  onAdd,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onKeyDown,
}: {
  day: CalendarDay;
  height: number;
  events: CalendarEvent[];
  selected: number | null;
  landing: Landing | null;
  nowMinutes: number | null;
  minutesToY: (m: number) => number;
  yToMinutes: (y: number) => number;
  onAdd: (dayId: number, minutes: number) => void;
  onPointerDown: (
    ev: ReactPointerEvent<HTMLElement>,
    event: CalendarEvent,
    mode: "move" | "resize",
  ) => void;
  onPointerMove: (ev: ReactPointerEvent<HTMLElement>, event: CalendarEvent) => void;
  onPointerUp: (event: CalendarEvent) => void;
  onKeyDown: (ev: ReactKeyboardEvent<HTMLElement>, event: CalendarEvent) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);

  const byId = new Map(events.map((e) => [e.id, e]));
  const packed = packColumn(events);

  // The block for a cross-day drag stays in its own column (see `shown`), so
  // the target column shows where it would land instead.
  const incoming =
    landing && landing.dayId === day.id && !byId.has(landing.eventId) ? landing : null;

  // No `data-day-column` — what `columnAt` scans — so a drag can't land here.
  if (day.outside) {
    return (
      <div
        aria-hidden
        className={`relative border-l border-rule ${OUTSIDE_DAY_CLASS} first:border-l-0`}
        style={{ height }}
      />
    );
  }

  return (
    <div
      data-day-column={day.id}
      className={cx(
        "relative border-l border-rule first:border-l-0",
        landing?.dayId === day.id && "bg-pen-soft/30",
      )}
      style={{ height }}
    >
      {/* One rule an hour, painted rather than built from elements — a week
          costs a gradient instead of 500 divs. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: `repeating-linear-gradient(to bottom, var(--rule) 0 1px, transparent 1px ${HOUR_PX}px)`,
        }}
      />

      {/* A click anywhere empty adds at that minute; keyboard has no
          coordinates to read, so it opens at nine. */}
      <button
        type="button"
        aria-label={`Add an event on ${day.longLabel}`}
        // A cursor alone isn't an affordance you can see without moving the
        // mouse (ticket 120) — the empty column tints as well.
        className="absolute inset-0 cursor-copy transition-colors hover:bg-sheet-2/60"
        onPointerMove={(ev) => {
          const rect = ev.currentTarget.getBoundingClientRect();
          setHover(clamp(snap(yToMinutes(ev.clientY - rect.top)), 0, 24 * 60));
        }}
        onPointerLeave={() => setHover(null)}
        onClick={(ev) => {
          if (ev.detail === 0) return onAdd(day.id, 9 * 60);
          const rect = ev.currentTarget.getBoundingClientRect();
          onAdd(day.id, clamp(snap(yToMinutes(ev.clientY - rect.top)), 0, 24 * 60));
        }}
      />

      <ColumnMarks
        hover={landing ? null : hover}
        incoming={incoming}
        nowMinutes={nowMinutes}
        minutesToY={minutesToY}
      />

      {packed.map(({ id, start, end, lane, lanes }) => {
        const event = byId.get(id)!;
        const top = minutesToY(start);
        const boxHeight = Math.max(minutesToY(end) - top - 2, 16);
        return (
          <EventBlock
            key={id}
            event={event}
            dayLabel={day.longLabel}
            selected={selected === id}
            landed={landing?.eventId === id}
            top={top}
            boxHeight={boxHeight}
            left={`calc(${(lane / lanes) * 100}% + 2px)`}
            width={`calc(${100 / lanes}% - 5px)`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onKeyDown={onKeyDown}
          />
        );
      })}
    </div>
  );
}

// The column's transient marks: the add-here pill under the cursor, the drop
// line for an event arriving from another column, and the now line.
function ColumnMarks({
  hover,
  incoming,
  nowMinutes,
  minutesToY,
}: {
  hover: number | null;
  incoming: Landing | null;
  nowMinutes: number | null;
  minutesToY: (m: number) => number;
}) {
  return (
    <>
      {hover !== null ? (
        <span
          aria-hidden
          className="nums pointer-events-none absolute left-1 z-10 -translate-y-1/2 rounded-full bg-pen px-1.5 text-[10px] text-sheet"
          style={{ top: minutesToY(hover) }}
        >
          + {toHhmm(hover)}
        </span>
      ) : null}

      {incoming ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-dashed border-pen"
          style={{ top: minutesToY(toMinutes(incoming.time) ?? 0) }}
        >
          <span className="nums ml-1 rounded-full bg-pen px-1.5 text-[10px] text-sheet">
            {formatSpan({ ...incoming, allDay: false })}
          </span>
        </div>
      ) : null}

      {/* The blob marks which end of the line to read from and stays findable
          where the line crosses an empty hour. Time named for screen readers —
          colour is never the only signal. */}
      {nowMinutes !== null ? (
        <div
          className="pointer-events-none absolute inset-x-0 z-10 border-t border-red"
          style={{ top: minutesToY(nowMinutes) }}
        >
          <span
            aria-hidden
            className="absolute left-0 top-0 size-[9px] -translate-x-[1px] -translate-y-1/2 rounded-full bg-red"
          />
          <span className="sr-only">Now — {toHhmm(nowMinutes)}</span>
        </div>
      ) : null}
    </>
  );
}

// One event, placed and sized by the column. Draws its own text and the resize
// grip; the pointer/keyboard gestures are forwarded up.
function EventBlock({
  event,
  dayLabel,
  selected,
  landed,
  top,
  boxHeight,
  left,
  width,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onKeyDown,
}: {
  event: CalendarEvent;
  dayLabel: string;
  selected: boolean;
  landed: boolean;
  top: number;
  boxHeight: number;
  left: string;
  width: string;
  onPointerDown: (ev: ReactPointerEvent<HTMLElement>, event: CalendarEvent, mode: "move" | "resize") => void;
  onPointerMove: (ev: ReactPointerEvent<HTMLElement>, event: CalendarEvent) => void;
  onPointerUp: (event: CalendarEvent) => void;
  onKeyDown: (ev: ReactKeyboardEvent<HTMLElement>, event: CalendarEvent) => void;
}) {
  const span = spanOf(event)!;
  const short = boxHeight < 46;
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`${event.title}, ${formatSpan(event)}, ${dayLabel}`}
      onPointerDown={(ev) => onPointerDown(ev, event, "move")}
      onPointerMove={(ev) => onPointerMove(ev, event)}
      onPointerUp={() => onPointerUp(event)}
      onPointerCancel={() => onPointerUp(event)}
      onKeyDown={(ev) => onKeyDown(ev, event)}
      style={{
        top,
        height: boxHeight,
        left,
        width,
        // Without this a touch drag scrolls the page instead.
        touchAction: "none",
        // An end nobody has written is drawn, not known: the dashes say the
        // bottom edge is a guess and the handle is how to fix it.
        borderBottomStyle: span.open ? "dashed" : undefined,
      }}
      className={cx(
        // `pb-2.5` keeps the last line of text off the grip pill, and
        // `scroll-mt-32` keeps the block clear of the sticky head when focusing
        // it scrolls it into view (see `scrollPaddingTop`).
        "absolute z-[2] flex scroll-mt-32 flex-col justify-start overflow-hidden rounded-md border border-l-4 px-1.5 pt-0.5 pb-2.5 text-left text-xs leading-tight shadow-card",
        EVENT_CATEGORIES[event.type].block,
        selected && "z-[4] outline-2 outline-ink",
        landed && "opacity-70",
      )}
    >
      <span className="block font-semibold">
        {event.title}
        {event.hasNote ? <span aria-hidden> ✎</span> : null}
      </span>
      <span className="nums block text-[10px] opacity-85">
        {formatSpan(event)}
        {span.open ? " · no end" : null}
      </span>
      {!short && event.placeName ? (
        <span className="block opacity-80">{event.placeName}</span>
      ) : null}
      {!short && event.commentCount > 0 ? (
        <span className="typed block">
          {event.commentCount} {event.commentCount === 1 ? "comment" : "comments"}
        </span>
      ) : null}

      {/* Resize handle: a span, not a button — a button inside a button isn't
          valid markup. Keyboard equivalent is ↑/↓ on the block. The grip pill
          isn't decoration; without it the strip is invisible. */}
      <span
        aria-hidden
        onPointerDown={(ev) => {
          ev.stopPropagation();
          onPointerDown(ev, event, "resize");
        }}
        onPointerMove={(ev) => onPointerMove(ev, event)}
        onPointerUp={() => onPointerUp(event)}
        className={cx("absolute inset-x-0 bottom-0 cursor-ns-resize", short ? "h-1.5" : "h-2")}
      >
        <span className="absolute bottom-[2px] left-1/2 h-[2px] w-[22px] -translate-x-1/2 rounded-full bg-current opacity-35" />
      </span>
    </button>
  );
}
