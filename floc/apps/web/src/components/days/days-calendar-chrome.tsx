"use client";

/**
 * The Days calendar's chrome (ticket 243, split from `days-calendar`): the
 * toolbar, the all-day strip, the clock, the event modal and the add dialog. All drawing and
 * dispatch — no gesture logic lives here.
 */
import {
  useState,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
} from "react";

import { EventForm, type PlaceSearch } from "@/components/days/event-form";
import { EventMarkers } from "@/components/days/event-markers";
import { DayColumn, type ColumnVariant } from "@/components/days/days-calendar-column";
import { FoldIcon } from "@/components/days/days-glyphs";
import { Dialog } from "@/components/system/dialog";
import { ChevronIcon, PlusIcon } from "@/components/system/icons";
import { Button, cx } from "@/components/system/ui";
import {
  OUTSIDE_DAY_CLASS,
  type CalendarDay,
  type CalendarEvent,
} from "@/components/days/days-calendar-shared";
import { EVENT_CATEGORIES } from "@floc/core/itinerary/event-categories";
import { spanOf, toHhmm, toMinutes } from "@floc/core/dates/calendar";
import type { ClockLayout } from "@floc/core/dates/clock-fold";

export type DayStepper = {
  hasToday: boolean;
  onToday: () => void;
  goPrev: () => void;
  goNext: () => void;
  canPrev: boolean;
  canNext: boolean;
};

export function CalendarToolbar({
  nav,
  rangeLabel,
  unfold,
  onToggleFold,
  onAdd,
}: {
  nav: DayStepper;
  rangeLabel: string;
  unfold: boolean;
  onToggleFold: () => void;
  onAdd: () => void;
}) {
  const step = "!size-8 !p-0";
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-rule px-3 py-2.5">
      <Button onClick={nav.onToday} disabled={!nav.hasToday} title={nav.hasToday ? undefined : "The trip isn't running today"}>
        Today
      </Button>
      <Button onClick={nav.goPrev} disabled={!nav.canPrev} aria-label="Day before" title={nav.canPrev ? "Day before" : "The trip starts here"} className={step}>
        <ChevronIcon direction="left" />
      </Button>
      <Button onClick={nav.goNext} disabled={!nav.canNext} aria-label="Day after" title={nav.canNext ? "Day after" : "The trip ends here"} className={step}>
        <ChevronIcon direction="right" />
      </Button>
      {/* Announced, not drawn: the focus head already says which day you are
          on. Live so the arrows still report where they landed. */}
      <p className="sr-only" aria-live="polite">
        {rangeLabel}
      </p>

      <div className="flex-1" />

      <Button variant="ghost" onClick={onToggleFold} aria-pressed={unfold} className="max-sm:order-last max-sm:basis-full max-sm:!justify-start">
        <FoldIcon />
        {unfold ? "Fold empty hours" : "Every hour"}
      </Button>
      <Button variant="primary" onClick={onAdd}>
        <PlusIcon size={12} />
        Add event
      </Button>
    </div>
  );
}

// Things that happen *on* a day rather than at a time keep their own strip
// above the clock, rather than inventing a time. Owns its own drag state — the
// all-day drag is a day change (`moveEventToDay`), never a reschedule.
export function AllDayStrip({
  slots,
  focusId,
  events,
  rowStyle,
  selected,
  onSelect,
  onMove,
}: {
  slots: CalendarDay[];
  focusId: number;
  events: CalendarEvent[];
  rowStyle: CSSProperties;
  selected: number | null;
  onSelect: (id: number) => void;
  /** All-day has no time to drop, so this is a change of day only. */
  onMove: (event: CalendarEvent, to: CalendarDay) => void;
}) {
  const [dragId, setDragId] = useState<number | null>(null);
  const [overDay, setOverDay] = useState<number | null>(null);

  return (
    <div style={rowStyle} className="border-b border-rule bg-sheet-2">
      {/* Not `.typed`: "All day" wrapped to two lines in a gutter sized for
          "00:00" at that size. */}
      <div className="flex items-center justify-end border-r border-rule bg-sheet-2 px-1 py-1.5 sm:px-1.5">
        <span className="whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.02em] text-ink-faint">
          All day
        </span>
      </div>
      {slots.map((day) => (
        <div
          key={day.id}
          onDragOver={(ev) => {
            if (dragId === null || day.outside) return;
            ev.preventDefault();
            setOverDay(day.id);
          }}
          onDragLeave={() => setOverDay((d) => (d === day.id ? null : d))}
          onDrop={(ev) => {
            ev.preventDefault();
            const moving = events.find((e) => e.id === dragId);
            setDragId(null);
            setOverDay(null);
            if (!moving || moving.dayId === day.id || day.outside) return;
            onMove(moving, day);
          }}
          className={cx(
            "grid min-h-8 min-w-0 content-start gap-1 border-l border-rule p-1",
            day.outside ? OUTSIDE_DAY_CLASS : day.id === focusId && "bg-sheet",
            overDay === day.id && "bg-pen-soft",
          )}
        >
          {events
            .filter((e) => e.dayId === day.id && !spanOf(e))
            .map((event) => (
              <button
                key={event.id}
                type="button"
                draggable
                onDragStart={() => setDragId(event.id)}
                onDragEnd={() => {
                  setDragId(null);
                  setOverDay(null);
                }}
                onClick={() => onSelect(event.id)}
                aria-pressed={selected === event.id}
                aria-label={`${event.title}, all day, ${day.longLabel}`}
                className={cx(
                  "min-h-5 truncate rounded-md border border-l-4 px-1.5 py-0.5 text-left text-xs",
                  EVENT_CATEGORIES[event.type].block,
                  selected === event.id && "outline-2 outline-ink",
                )}
              >
                {/* Why: a neighbour on a phone is a 38px sliver; its chips keep their colour and drop the words. */}
                <span className={cx(day.id !== focusId && "max-sm:hidden")}>
                  {event.title}
                  <EventMarkers hasNote={event.hasNote} hasFiles={event.hasFiles} />
                </span>
              </button>
            ))}
        </div>
      ))}
    </div>
  );
}

// The clock: the hour gutter, a column per slot, and one layer over the
// columns for the hour rules and the folded hours. An hour's label centres
// *on* its line, so the row is inset by half a label.
export function CalendarGrid({
  gridRef,
  rowStyle,
  clock,
  slots,
  focusId,
  column,
  onToggleFold,
}: {
  gridRef: React.RefObject<HTMLDivElement | null>;
  rowStyle: CSSProperties;
  clock: ClockLayout;
  slots: CalendarDay[];
  focusId: number;
  /** Everything a column needs besides its day: the parent's state and gestures. */
  column: (day: CalendarDay, variant: ColumnVariant) => ComponentProps<typeof DayColumn>;
  onToggleFold: () => void;
}) {
  const last = clock.segments[clock.segments.length - 1];
  const marks = [...clock.segments.map((s) => ({ y: s.y, minute: s.from })), { y: clock.height, minute: last.to }];
  return (
    <div style={rowStyle} ref={gridRef} className="relative my-2.5">
      <div className="relative border-r border-rule bg-sheet" style={{ height: clock.height }}>
        {marks.map(({ y, minute }) => (
          <span
            key={minute}
            // Not `.typed`: at 11px the clock was the smallest text on a page
            // it's meant to be read off.
            className="nums absolute right-1.5 -translate-y-1/2 text-[11px] tracking-[0.02em] text-ink-soft sm:right-2 sm:text-[13px]"
            style={{ top: y }}
          >
            {toHhmm(minute % (24 * 60))}
          </span>
        ))}
      </div>

      {slots.map((day) => (
        <DayColumn key={day.id} {...column(day, day.id === focusId ? "focus" : "side")} />
      ))}

      <div className="pointer-events-none absolute inset-y-0 right-0 left-[var(--days-gutter)]">
        {marks.map(({ y, minute }) => (
          <i key={minute} className="absolute inset-x-0 z-[1] border-t border-rule" style={{ top: y }} />
        ))}
        {clock.segments
          .filter((s) => s.folded)
          .map((s) => (
            <button
              key={s.from}
              type="button"
              onClick={onToggleFold}
              aria-label={`${toHhmm(s.from)} to ${toHhmm(s.to)}, nothing planned. Show every hour`}
              className="pointer-events-auto absolute inset-x-0 z-[3] flex items-center justify-center gap-2 border-y border-dashed border-rule-strong bg-sheet-2 text-xs text-ink-soft transition-colors hover:text-pen"
              style={{ top: s.y, height: s.height }}
            >
              <FoldIcon size={12} />
              <span>
                <span className="nums">
                  {toHhmm(s.from)} – {toHhmm(s.to)}
                </span>{" "}
                nothing planned
              </span>
            </button>
          ))}
      </div>
    </div>
  );
}

const CALENDAR_DIALOG = "m-auto w-full max-w-lg rounded-lg bg-sheet p-0 text-ink shadow-card backdrop:bg-black/40";

/**
 * The event modal (ticket 321) — one centred sheet holding the event's facts
 * and its comment thread. Replaced the side pane and its Event/Trip-notes
 * tabs; trip-wide talk lives on the Notes page now. Backdrop or ✕ closes,
 * matching `AddEventDialog`.
 */
export function EventModal({
  open,
  onClose,
  panel,
}: {
  open: boolean;
  onClose: () => void;
  panel: ReactNode;
}) {
  return (
    <Dialog open={open} onClose={onClose} title="Event" className={CALENDAR_DIALOG}>
      {open ? (
        <>
          <div className="flex items-center justify-end border-b border-rule bg-sheet-2 px-3 py-2">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              title="Close"
              className="rounded-sm px-2 text-lg leading-none text-ink-faint hover:text-ink"
            >
              ×
            </button>
          </div>
          <div className="max-h-[75vh] overflow-y-auto p-4">{panel}</div>
        </>
      ) : null}
    </Dialog>
  );
}

export function AddEventDialog({
  adding,
  days,
  submitEvent,
  searchPlaces,
  onClose,
}: {
  adding: { dayId: number; time: string; endTime?: string } | null;
  days: CalendarDay[];
  submitEvent: (formData: FormData) => Promise<void>;
  searchPlaces: PlaceSearch;
  onClose: () => void;
}) {
  return (
    <Dialog open={adding !== null} onClose={onClose} title="Add an event" className={CALENDAR_DIALOG}>
      {adding ? (
        <>
          <div className="flex items-center justify-between border-b border-rule px-4 py-3">
            <h2 className="font-display text-base font-semibold">
              Add an event — {days.find((d) => d.id === adding.dayId)?.longLabel}, {adding.time}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-sm px-2 text-lg leading-none text-ink-faint hover:text-ink"
            >
              ×
            </button>
          </div>
          {/* Submitting dismisses the dialog; the action revalidates the page
              underneath it. Same contract as `Sheet`. */}
          <div className="p-4" onSubmit={() => setTimeout(onClose, 0)}>
            <EventForm
              action={submitEvent}
              searchPlaces={searchPlaces}
              defaults={{
                dayId: adding.dayId,
                time: adding.time,
                // An hour long by default — the commonest answer, and the bottom
                // edge is right there if it's wrong.
                endTime: adding.endTime ?? toHhmm(Math.min((toMinutes(adding.time) ?? 540) + 60, 24 * 60)),
              }}
            />
          </div>
        </>
      ) : null}
    </Dialog>
  );
}
