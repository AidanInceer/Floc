"use client";

/**
 * One day's slice of the clock (ticket 243, split from `days-calendar`): the
 * catcher that turns a click into a minute, the free stretches, and the
 * blocks. The focus day draws its blocks in full; a neighbour draws them
 * smaller, and as colour only on a phone (B5). Draws and forwards gestures —
 * the rules for what they mean live in `@floc/core/dates/calendar-gestures`.
 */
import { useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";

import { cx } from "@/components/system/ui";
import { PlusIcon } from "@/components/system/icons";
import { ChatIcon, EventGlyph, NoteIcon } from "@/components/days/days-glyphs";
import { EventMarkers } from "@/components/days/event-markers";
import {
  OUTSIDE_DAY_CLASS,
  type CalendarDay,
  type CalendarEvent,
  type Landing,
} from "@/components/days/days-calendar-shared";
import { clamp, formatSpan, packLanes, snap, spanOf, toHhmm, toMinutes } from "@floc/core/dates/calendar";
import { freeStretches, type ClockLayout } from "@floc/core/dates/clock-fold";
import { EVENT_CATEGORIES } from "@floc/core/itinerary/event-categories";

export type ColumnVariant = "focus" | "side";

type Gestures = {
  onPointerDown: (ev: ReactPointerEvent<HTMLElement>, event: CalendarEvent, mode: "move" | "resize") => void;
  onPointerMove: (ev: ReactPointerEvent<HTMLElement>, event: CalendarEvent) => void;
  onPointerUp: (event: CalendarEvent) => void;
  onKeyDown: (ev: ReactKeyboardEvent<HTMLElement>, event: CalendarEvent) => void;
};

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
  variant,
  clock,
  events,
  selected,
  landing,
  nowMinutes,
  minutesToY,
  yToMinutes,
  onAdd,
  gestures,
}: {
  day: CalendarDay;
  variant: ColumnVariant;
  clock: ClockLayout;
  events: CalendarEvent[];
  selected: number | null;
  landing: Landing | null;
  nowMinutes: number | null;
  minutesToY: (m: number) => number;
  yToMinutes: (y: number) => number;
  onAdd: (dayId: number, minutes: number, endMinutes?: number) => void;
  gestures: Gestures;
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
    return <div aria-hidden className={cx("relative border-l border-rule", OUTSIDE_DAY_CLASS)} style={{ height: clock.height }} />;
  }

  const stretches = variant === "focus" ? freeStretches(packed, clock) : [];

  return (
    <div
      data-day-column={day.id}
      className={cx(
        "relative border-l border-rule",
        variant === "side" && "bg-sheet-2",
        landing?.dayId === day.id && "bg-pen-soft/30",
      )}
      style={{ height: clock.height }}
    >
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

      {stretches.map(({ from, to }) => (
        <button
          key={from}
          type="button"
          onClick={() => onAdd(day.id, from, to)}
          className="absolute inset-x-1.5 z-[1] flex items-center justify-center gap-1.5 rounded-sm border-[1.5px] border-dashed border-rule-strong text-[12.5px] text-ink-faint transition-colors hover:border-pen hover:bg-pen-soft hover:text-pen-deep"
          style={{ top: minutesToY(from) + 4, height: minutesToY(to) - minutesToY(from) - 8 }}
        >
          <PlusIcon size={12} />
          <span>
            <span className="nums">
              {toHhmm(from)} – {toHhmm(to)}
            </span>{" "}
            free
          </span>
        </button>
      ))}

      <ColumnMarks
        hover={landing ? null : hover}
        incoming={incoming}
        nowMinutes={nowMinutes}
        minutesToY={minutesToY}
      />

      {packed.map(({ id, start, end, lane, lanes }) => {
        const top = minutesToY(start);
        return (
          <EventBlock
            key={id}
            event={byId.get(id)!}
            variant={variant}
            dayLabel={day.longLabel}
            selected={selected === id}
            landed={landing?.eventId === id}
            box={{
              top,
              height: Math.max(minutesToY(end) - top - 2, 18),
              left: `calc(${(lane / lanes) * 100}% + 3px)`,
              width: `calc(${100 / lanes}% - 6px)`,
            }}
            gestures={gestures}
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
  variant,
  dayLabel,
  selected,
  landed,
  box,
  gestures,
}: {
  event: CalendarEvent;
  variant: ColumnVariant;
  dayLabel: string;
  selected: boolean;
  landed: boolean;
  box: { top: number; height: number; left: string; width: string };
  gestures: Gestures;
}) {
  const span = spanOf(event)!;
  const tight = box.height < 40;
  const focus = variant === "focus";
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`${event.title}, ${formatSpan(event)}, ${dayLabel}`}
      onPointerDown={(ev) => gestures.onPointerDown(ev, event, "move")}
      onPointerMove={(ev) => gestures.onPointerMove(ev, event)}
      onPointerUp={() => gestures.onPointerUp(event)}
      onPointerCancel={() => gestures.onPointerUp(event)}
      onKeyDown={(ev) => gestures.onKeyDown(ev, event)}
      style={{
        ...box,
        // Without this a touch drag scrolls the page instead.
        touchAction: "none",
        // An end nobody has written is drawn, not known: the dashes say the
        // bottom edge is a guess and the handle is how to fix it.
        borderBottomStyle: span.open ? "dashed" : undefined,
      }}
      className={cx(
        // `scroll-mt-32` keeps the block clear of the sticky head when focusing
        // it scrolls it into view (see `scrollPaddingTop`).
        "absolute z-[2] flex scroll-mt-32 overflow-hidden rounded-sm border text-left leading-tight",
        EVENT_CATEGORIES[event.type].block,
        tight ? "flex-row items-center gap-2 px-2" : "flex-col gap-0.5",
        !tight && (focus ? "px-3 py-2" : "px-2 py-1.5 max-sm:p-0"),
        selected && "z-[4] outline-2 outline-ink",
        landed && "opacity-70",
      )}
    >
      <BlockText event={event} focus={focus} tight={tight} open={span.open} />

      {/* Resize handle: a span, not a button — a button inside a button isn't
          valid markup. Keyboard equivalent is ↑/↓ on the block. The grip pill
          isn't decoration; without it the strip is invisible. */}
      <span
        aria-hidden
        onPointerDown={(ev) => {
          ev.stopPropagation();
          gestures.onPointerDown(ev, event, "resize");
        }}
        onPointerMove={(ev) => gestures.onPointerMove(ev, event)}
        onPointerUp={() => gestures.onPointerUp(event)}
        className={cx("absolute inset-x-0 bottom-0 cursor-ns-resize", tight ? "h-1.5" : "h-2")}
      >
        <span className="absolute bottom-[2px] left-1/2 h-[2px] w-[22px] -translate-x-1/2 rounded-full bg-current opacity-35" />
      </span>
    </button>
  );
}

// Why: on a phone a neighbour is a 38px sliver, so its blocks keep their colour and drop every word.
function BlockText({
  event,
  focus,
  tight,
  open,
}: {
  event: CalendarEvent;
  focus: boolean;
  tight: boolean;
  open: boolean;
}) {
  const words = focus ? "" : "max-sm:hidden";
  const time = (
    <span className={cx("nums whitespace-nowrap", focus ? "text-xs" : "text-[11px]", words)}>
      {tight ? event.time : `${formatSpan(event)}${open ? " · no end" : ""}`}
    </span>
  );
  const title = (
    <span className={cx("font-medium text-ink", focus ? "text-[15px]" : "text-[13px]", tight && "truncate", words)}>
      {event.title}
    </span>
  );
  if (tight) {
    return (
      <>
        {time}
        {title}
      </>
    );
  }
  return (
    <>
      {time}
      {title}
      <span className={cx("mt-0.5 flex items-center gap-1.5", focus ? "text-[12.5px]" : "text-[11.5px]", words)}>
        <EventGlyph type={event.type} transportType={event.transportType} size={12} />
        {focus && event.placeName ? <span className="truncate">{event.placeName}</span> : null}
        <span className="ml-auto flex items-center gap-1.5">
          {focus ? <FocusMarkers event={event} /> : <EventMarkers hasNote={event.hasNote} hasFiles={event.hasFiles} />}
        </span>
      </span>
      {focus && event.note ? (
        <span className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-ink-soft">{event.note}</span>
      ) : null}
    </>
  );
}

function FocusMarkers({ event }: { event: CalendarEvent }) {
  return (
    <>
      {event.hasNote ? <NoteIcon size={12} /> : null}
      <EventMarkers hasNote={false} hasFiles={event.hasFiles} />
      {event.commentCount > 0 ? (
        <span className="nums flex items-center gap-0.5">
          <ChatIcon size={12} />
          {event.commentCount}
          <span className="sr-only">{event.commentCount === 1 ? "comment" : "comments"}</span>
        </span>
      ) : null}
    </>
  );
}
