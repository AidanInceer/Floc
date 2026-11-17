"use client";

import {
  useState,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
} from "react";

import { EventForm, type PlaceSearch } from "@/components/days/event-form";
import { EventMarkers } from "@/components/days/event-markers";
import { DayColumn, type ColumnVariant } from "@/components/days/days-calendar-column";
import { FoldIcon } from "@/components/system/icons/days";
import { Dialog } from "@/components/system/dialog";
import { ChevronIcon, PlusIcon } from "@/components/system/icons";
import { Button, cx, iconFrameClass } from "@/components/system/ui";
import {
  OUTSIDE_DAY_CLASS,
  onlyClass,
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

export type WeekStepper = {
  label: string;
  goPrev: () => void;
  goNext: () => void;
  canPrev: boolean;
  canNext: boolean;
};

export function CalendarToolbar({
  nav,
  week,
  rangeLabel,
  unfold,
  onToggleFold,
  onAdd,
}: {
  nav: DayStepper;
  week: WeekStepper;
  rangeLabel: string;
  unfold: boolean;
  onToggleFold: () => void;
  onAdd: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-rule px-3 py-2.5">
      {nav.hasToday ? <Button onClick={nav.onToday}>Today</Button> : null}
      <button type="button" onClick={nav.goPrev} disabled={!nav.canPrev} aria-label="Day before" title={nav.canPrev ? "Day before" : "The trip starts here"} className={cx(iconFrameClass(), "lg:hidden")}>
        <ChevronIcon direction="left" />
      </button>
      <button type="button" onClick={nav.goNext} disabled={!nav.canNext} aria-label="Day after" title={nav.canNext ? "Day after" : "The trip ends here"} className={cx(iconFrameClass(), "lg:hidden")}>
        <ChevronIcon direction="right" />
      </button>
      <button type="button" onClick={week.goPrev} disabled={!week.canPrev} aria-label="Week before" title={week.canPrev ? "Week before" : "The trip starts this week"} className={cx(iconFrameClass(), "max-lg:hidden")}>
        <ChevronIcon direction="left" />
      </button>
      <button type="button" onClick={week.goNext} disabled={!week.canNext} aria-label="Week after" title={week.canNext ? "Week after" : "The trip ends this week"} className={cx(iconFrameClass(), "max-lg:hidden")}>
        <ChevronIcon direction="right" />
      </button>
      <p className="nums ml-1 text-[13px] text-ink-soft max-lg:hidden">{week.label}</p>
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
  onMove: (event: CalendarEvent, to: CalendarDay) => void;
}) {
  const [dragId, setDragId] = useState<number | null>(null);
  const [overDay, setOverDay] = useState<number | null>(null);

  return (
    <div style={rowStyle} data-days-row className="border-b border-rule bg-sheet-2">
      <div className="flex items-center justify-end border-r border-rule bg-sheet-2 px-1 py-1.5 sm:px-1.5">
        <span className="whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.02em] text-ink-faint">
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
            onlyClass(day.only),
            day.outside ? OUTSIDE_DAY_CLASS : day.id === focusId ? "bg-sheet" : "lg:bg-sheet",
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
                  "min-h-5 truncate rounded-sm border border-l-4 px-1.5 py-0.5 text-left text-xs",
                  EVENT_CATEGORIES[event.type].block,
                  selected === event.id && "outline-2 outline-ink",
                )}
              >
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
  column: (day: CalendarDay, variant: ColumnVariant) => ComponentProps<typeof DayColumn>;
  onToggleFold: () => void;
}) {
  const last = clock.segments[clock.segments.length - 1];
  const marks = [...clock.segments.map((s) => ({ y: s.y, minute: s.from })), { y: clock.height, minute: last.to }];
  return (
    <div style={rowStyle} ref={gridRef} data-days-row className="relative my-2.5">
      <div className="relative border-r border-rule bg-sheet" style={{ height: clock.height }}>
        {marks.map(({ y, minute }) => (
          <span
            key={minute}
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

      <div data-days-overlay className="pointer-events-none absolute inset-y-0 right-0 left-[var(--days-gutter)]">
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
              className="pointer-events-auto absolute inset-x-0 z-[3] flex items-center justify-center gap-2 border-y border-dashed border-rule-strong text-xs text-ink-soft transition-colors hover:text-pen"
              style={{ top: s.y, height: s.height }}
            >
              <FoldGround slots={slots} focusId={focusId} />
              <FoldIcon size={12} className="relative" />
              <span className="relative">
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

function FoldGround({ slots, focusId }: { slots: CalendarDay[]; focusId: number }) {
  return (
    <span aria-hidden data-days-row className="absolute inset-0 grid grid-cols-[var(--days-tracks)]">
      {slots.map((day) => (
        <span key={day.id} className={cx("border-l border-rule", onlyClass(day.only), !day.outside && (day.id === focusId ? "bg-sheet" : "bg-sheet-2 lg:bg-sheet"))} />
      ))}
    </span>
  );
}

export const CALENDAR_DIALOG =
  "m-auto w-full max-w-lg overflow-y-auto rounded-md border border-rule bg-sheet p-0 text-ink shadow-lifted backdrop:bg-black/40 max-h-[calc(100dvh-48px)] max-sm:mb-0 max-sm:max-h-[92dvh] max-sm:max-w-full max-sm:rounded-b-none";

export function EventModal({
  event,
  dateLabel,
  onClose,
  submitEvent,
  searchPlaces,
  rest,
}: {
  event: CalendarEvent | null;
  dateLabel: string;
  onClose: () => void;
  submitEvent: (formData: FormData) => Promise<void>;
  searchPlaces: PlaceSearch;
  rest: ReactNode | null;
}) {
  return (
    <Dialog open={event !== null} onClose={onClose} title="Event" className={CALENDAR_DIALOG}>
      {event ? (
        <div>
          <EventForm
            key={event.id}
            autosave
            action={submitEvent}
            searchPlaces={searchPlaces}
            dateLabel={dateLabel}
            defaults={{
              dayId: event.dayId,
              eventId: event.id,
              type: event.type,
              transportType: event.transportType,
              time: event.time,
              endTime: event.endTime,
              allDay: event.allDay || !event.time,
              title: event.writtenTitle,
              note: event.note,
              placeName: event.placeName,
            }}
          />
          {rest ?? <p role="status" className="sr-only">Loading event…</p>}
        </div>
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
  const day = adding ? days.find((d) => d.id === adding.dayId) : undefined;
  return (
    <Dialog open={adding !== null} onClose={onClose} title={`Add an event, ${day?.longLabel ?? ""}`} className={CALENDAR_DIALOG}>
      {adding ? (
        <div onSubmit={() => setTimeout(onClose, 0)}>
          <EventForm
            action={submitEvent}
            searchPlaces={searchPlaces}
            dateLabel={day?.shortLabel ?? ""}
            defaults={{
              dayId: adding.dayId,
              time: adding.time,
              endTime: adding.endTime ?? toHhmm(Math.min((toMinutes(adding.time) ?? 540) + 60, 24 * 60)),
            }}
          />
        </div>
      ) : null}
    </Dialog>
  );
}
