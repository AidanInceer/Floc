"use client";

/**
 * The Days calendar's chrome (ticket 243, split from `days-calendar`): the
 * toolbar, the event/notes side pane, and the add-event dialog. All drawing and
 * dispatch — no gesture logic lives here.
 */
import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type CSSProperties,
  type ReactNode,
} from "react";

import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react";

import { EventForm, type PlaceSearch } from "@/components/days/event-form";
import { DayColumn } from "@/components/days/days-calendar-column";
import { Menu } from "@/components/system/client-ui";
import { Button, cx, menuItemClass } from "@/components/system/ui";
import type { DayEventType } from "@/db/schema";
import {
  HOUR_PX,
  OUTSIDE_DAY_CLASS,
  type CalendarDay,
  type CalendarEvent,
  type Landing,
} from "@/components/days/days-calendar-shared";
import { EVENT_CATEGORIES } from "@floc/core/itinerary/event-categories";
import { spanOf, toHhmm, toMinutes } from "@floc/core/dates/calendar";

export function CalendarToolbar({
  hasToday,
  onToday,
  goPrev,
  goNext,
  canPrev,
  canNext,
  rangeLabel,
  hidden,
  setHidden,
  effectiveView,
  setView,
}: {
  hasToday: boolean;
  onToday: () => void;
  goPrev: () => void;
  goNext: () => void;
  canPrev: boolean;
  canNext: boolean;
  rangeLabel: string;
  hidden: ReadonlySet<DayEventType>;
  setHidden: (update: (prev: ReadonlySet<DayEventType>) => ReadonlySet<DayEventType>) => void;
  effectiveView: "day" | "week";
  setView: (view: "day" | "week") => void;
}) {
  const typeCount = Object.keys(EVENT_CATEGORIES).length;
  const hiddenCount = hidden.size;
  const shownLabel = `${typeCount - hiddenCount} of ${typeCount} shown`;

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-rule bg-sheet-2 px-3 py-2.5">
      <Button onClick={onToday} disabled={!hasToday} title={hasToday ? undefined : "The trip isn't running today"}>
        Today
      </Button>
      <div className="flex gap-1">
        <Button
          onClick={goPrev}
          disabled={!canPrev}
          aria-label="Earlier days"
          title={canPrev ? "Earlier days" : "The trip starts here"}
          className="!px-2.5 text-[15px] leading-none"
        >
          ‹
        </Button>
        <Button
          onClick={goNext}
          disabled={!canNext}
          aria-label="Later days"
          title={canNext ? "Later days" : "The trip ends here"}
          className="!px-2.5 text-[15px] leading-none"
        >
          ›
        </Button>
      </div>
      {/* Announced, not drawn: the column heads below already say which day you
          are on, so printing it again cost a row and said nothing. Live so the
          arrows still report where they landed. */}
      <p className="sr-only" aria-live="polite">
        {rangeLabel}
      </p>

      <div className="flex-1" />

      {/* The block-colour key doubles as the filter (ticket 90), behind one
          triple-dot rather than three always-on swatches. */}
      {hiddenCount > 0 ? (
        <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-ink-soft">{shownLabel}</span>
      ) : null}
      <TypeFilter hidden={hidden} setHidden={setHidden} shownLabel={shownLabel} hiddenCount={hiddenCount} />

      <div className="inline-flex overflow-hidden rounded-full border border-rule-strong">
        {(["day", "week"] as const).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={effectiveView === option}
            onClick={() => setView(option)}
            className={cx(
              "px-3 py-1 font-mono text-[11px] uppercase tracking-[0.06em] transition-colors disabled:opacity-50",
              effectiveView === option ? "bg-pen text-sheet" : "bg-sheet text-ink-soft hover:bg-sheet-2",
            )}
          >
            {option === "day" ? "Day" : "Week"}
          </button>
        ))}
      </div>
    </div>
  );
}

export function DayHeads({
  shownDays,
  landingDayId,
  effectiveView,
  removeDayControls,
  rowStyle,
}: {
  shownDays: CalendarDay[];
  landingDayId: number | null;
  effectiveView: "day" | "week";
  removeDayControls: Record<number, ReactNode>;
  rowStyle: CSSProperties;
}) {
  return (
    <div style={rowStyle} className="border-b border-rule bg-sheet">
      <div className="sticky left-0 z-20 border-r border-rule bg-sheet" />
      {shownDays.map((day) => (
        <div
          key={day.id}
          className={cx(
            "border-l border-rule px-2 py-1.5 text-center first:border-l-0",
            // A day the trip doesn't cover is dimmed in the head as well as in
            // the column, so the two read as one thing.
            day.outside && `${OUTSIDE_DAY_CLASS} text-ink-faint`,
            // Today is the whole head, filled — a pill around just the number
            // moved that column's date to a different height.
            day.isToday && "bg-pen text-sheet",
            landingDayId === day.id && "bg-pen-soft",
          )}
        >
          <p className={cx("typed", day.isToday && "text-sheet/80")}>{day.weekday}</p>
          <p className="nums text-lg font-semibold">
            {day.dayOfMonth}
            {/* Colour is never the only signal (CLAUDE.md) — the word is here
                for anyone who can't see the fill. */}
            {day.isToday ? <span className="sr-only"> — today</span> : null}
          </p>
          {effectiveView === "day" ? (
            <div className="mt-1 flex justify-center">{removeDayControls[day.id]}</div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

// Things that happen *on* a day rather than at a time keep their own strip
// above the clock, rather than inventing a time. Owns its own drag state — the
// all-day drag is a day change (`moveEventToDay`), never a reschedule.
export function AllDayStrip({
  shownDays,
  events,
  rowStyle,
  selected,
  onSelect,
  moveEventToDay,
  say,
}: {
  shownDays: CalendarDay[];
  events: CalendarEvent[];
  rowStyle: CSSProperties;
  selected: number | null;
  onSelect: (id: number) => void;
  moveEventToDay: (eventId: number, fromDayId: number, toDayId: number) => Promise<void>;
  say: (message: string) => void;
}) {
  const [dragId, setDragId] = useState<number | null>(null);
  const [overDay, setOverDay] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  return (
    <div style={rowStyle} className="border-b border-rule bg-sheet-2">
      {/* Not `.typed`: "All day" wrapped to two lines in a gutter sized for
          "00:00" at that size. */}
      <div className="sticky left-0 z-20 flex items-center justify-end border-r border-rule bg-sheet-2 px-1.5 py-1.5">
        <span className="whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.02em] text-ink-faint">
          All day
        </span>
      </div>
      {shownDays.map((day) => (
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
            startTransition(async () => {
              await moveEventToDay(moving.id, moving.dayId, day.id);
            });
            say(`${moving.title} moved to ${day.longLabel}.`);
          }}
          className={cx(
            "grid min-h-8 content-start gap-1 border-l border-rule p-1 first:border-l-0",
            day.outside && OUTSIDE_DAY_CLASS,
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
                  "truncate rounded-md border border-l-4 px-1.5 py-0.5 text-left text-xs",
                  EVENT_CATEGORIES[event.type].block,
                  selected === event.id && "outline-2 outline-ink",
                )}
              >
                {event.title}
                {event.hasNote ? <span aria-hidden> ✎</span> : null}
              </button>
            ))}
        </div>
      ))}
    </div>
  );
}

function TypeFilter({
  hidden,
  setHidden,
  shownLabel,
  hiddenCount,
}: {
  hidden: ReadonlySet<DayEventType>;
  setHidden: (update: (prev: ReadonlySet<DayEventType>) => ReadonlySet<DayEventType>) => void;
  shownLabel: string;
  hiddenCount: number;
}) {
  return (
    <Menu
      label={hiddenCount > 0 ? `Filter by type — ${shownLabel}` : "Filter by type"}
      triggerClassName={cx(
        "flex h-[26px] w-[26px] items-center justify-center rounded-full border",
        hiddenCount > 0
          ? "border-rule-strong bg-sheet text-ink"
          : "border-transparent text-ink-faint hover:border-rule-strong hover:bg-sheet-2 hover:text-ink",
      )}
    >
      {(Object.keys(EVENT_CATEGORIES) as DayEventType[]).map((type) => {
        const category = EVENT_CATEGORIES[type];
        const on = !hidden.has(type);
        return (
          <button
            key={type}
            type="button"
            role="menuitemcheckbox"
            aria-checked={on}
            onClick={() =>
              setHidden((prev) => {
                const next = new Set(prev);
                if (!next.delete(type)) next.add(type);
                return next;
              })
            }
            className={cx(
              menuItemClass,
              "!flex !items-center !gap-2 !font-mono !text-[10.5px] !uppercase !tracking-[0.06em]",
              on ? "!text-ink" : "!text-ink-faint !line-through",
            )}
          >
            <span aria-hidden className={cx("size-2 shrink-0 rounded-sm", category.dot)} />
            {category.label}
          </button>
        );
      })}
    </Menu>
  );
}

// The clock: the sticky hour gutter and a column per day. An hour's label
// centres *on* its line, so the row is inset by half a label — otherwise the
// first hour reads as hidden behind the all-day strip.
export function CalendarGrid({
  gridRef,
  rowStyle,
  gridHeight,
  startHour,
  endHour,
  shownDays,
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
  gridRef: React.RefObject<HTMLDivElement | null>;
  rowStyle: CSSProperties;
  gridHeight: number;
  startHour: number;
  endHour: number;
  shownDays: CalendarDay[];
  events: CalendarEvent[];
  selected: number | null;
  landing: Landing | null;
  nowMinutes: number | null;
  minutesToY: (m: number) => number;
  yToMinutes: (y: number) => number;
  onAdd: (dayId: number, minutes: number) => void;
  onPointerDown: (ev: ReactPointerEvent<HTMLElement>, event: CalendarEvent, mode: "move" | "resize") => void;
  onPointerMove: (ev: ReactPointerEvent<HTMLElement>, event: CalendarEvent) => void;
  onPointerUp: (event: CalendarEvent) => void;
  onKeyDown: (ev: ReactKeyboardEvent<HTMLElement>, event: CalendarEvent) => void;
}) {
  return (
    <div style={rowStyle} ref={gridRef} className="mt-2.5 mb-2.5">
      <div className="sticky left-0 z-20 border-r border-rule bg-sheet" style={{ height: gridHeight }}>
        <div className="relative h-full">
          {Array.from({ length: endHour - startHour + 1 }, (_, i) => (
            <span
              key={i}
              // Not `.typed`: at 11px the clock was the smallest text on a page
              // it's meant to be read off.
              className="nums absolute right-2 -translate-y-1/2 text-[13px] tracking-[0.02em] text-ink-soft"
              style={{ top: i * HOUR_PX }}
            >
              {String((startHour + i) % 24).padStart(2, "0")}:00
            </span>
          ))}
        </div>
      </div>

      {shownDays.map((day) => (
        <DayColumn
          key={day.id}
          day={day}
          height={gridHeight}
          events={events.filter((e) => e.dayId === day.id && spanOf(e))}
          selected={selected}
          landing={landing}
          nowMinutes={day.isToday ? nowMinutes : null}
          minutesToY={minutesToY}
          yToMinutes={yToMinutes}
          onAdd={onAdd}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onKeyDown={onKeyDown}
        />
      ))}
    </div>
  );
}

export function EventPane({
  tab,
  setTab,
  onClose,
  tripThread,
  panel,
}: {
  tab: "event" | "notes";
  setTab: (tab: "event" | "notes") => void;
  onClose: () => void;
  tripThread: ReactNode;
  panel: ReactNode;
}) {
  return (
    <aside className="flex min-w-0 flex-col bg-sheet">
      <div className="flex border-b border-rule bg-sheet-2">
        <div role="tablist" className="flex min-w-0 flex-1">
          {(
            [
              ["event", "Event"],
              ["notes", "Trip notes"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              role="tab"
              type="button"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
              className={cx(
                "flex-1 border-b-2 px-2 py-2 text-sm",
                tab === value
                  ? "border-pen bg-sheet font-semibold text-ink"
                  : "border-transparent text-ink-soft hover:text-ink",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {/* Clicking off the event closes the pane, but only once you know that —
            the ✕ is the visible way out, where a panel's close always is. */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close the event pane"
          title="Close"
          className="border-b-2 border-transparent px-3 py-2 text-sm text-ink-soft hover:text-ink"
        >
          ✕
        </button>
      </div>

      <div role="tabpanel" className="max-h-[70vh] overflow-y-auto p-3">
        {tab === "notes" ? tripThread : panel}
      </div>
    </aside>
  );
}

export function AddEventDialog({
  adding,
  days,
  submitEvent,
  searchPlaces,
  onClose,
}: {
  adding: { dayId: number; time: string } | null;
  days: CalendarDay[];
  submitEvent: (formData: FormData) => Promise<void>;
  searchPlaces: PlaceSearch;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (adding && !dialog.open) dialog.showModal();
    if (!adding && dialog.open) dialog.close();
  }, [adding]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(ev) => {
        if (ev.target === dialogRef.current) onClose();
      }}
      className="m-auto w-full max-w-lg rounded-lg bg-sheet p-0 text-ink shadow-card backdrop:bg-black/30"
    >
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
                endTime: toHhmm(Math.min((toMinutes(adding.time) ?? 540) + 60, 24 * 60)),
              }}
            />
          </div>
        </>
      ) : null}
    </dialog>
  );
}
