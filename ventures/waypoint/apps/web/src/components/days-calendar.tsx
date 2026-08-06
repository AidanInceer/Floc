"use client";

/**
 * Days as a calendar (ticket 103) — hours down, days across, events as blocks
 * you can put where you mean.
 *
 * The design is `docs/mockups/days-calendar-v2.html`, the second pass on the
 * option that was picked; the comment at the top of that file records what each
 * decision was weighed against. The three things it exists to get right, and
 * how they land here:
 *
 * 1. **Narrow widths.** A day column has a floor and the grid scrolls sideways
 *    under a pinned hour gutter, so seven days never turn to slivers. Below the
 *    width where even a scrolling week is nonsense the page drops to Day view
 *    on its own, disables Week with the reason on it, and says so in a notice —
 *    rather than silently doing something bad. The decision is measured on the
 *    **calendar element**, not the window: the side pane, and the app's own
 *    chrome around it, take their bite out of the width first.
 *
 * 2. **Quarter hours.** Rules are painted at the hour, the half and the
 *    quarter, the pointer's exact position is what a new event starts at, and a
 *    chip follows the cursor naming that quarter before you commit.
 *
 * 3. **Drag and drop.** One gesture moves an event to another time *and*
 *    another day, because "actually the kayaks are Friday" should not be an
 *    edit form. The bottom edge resizes. Every gesture has a keyboard
 *    equivalent (↑/↓ nudge 15 minutes, shift+←/→ move a day) and every outcome
 *    is announced in a live region — a drag must never be the only way.
 *
 * What this file does NOT own: the detail panel and the trip thread. Both are
 * rendered on the server and handed in as nodes, because both are full of
 * Server Actions — edit, delete, comment, react — and none of that has any
 * business being re-implemented on the client. This is geometry and gestures;
 * `days/page.tsx` is the content.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

import { EventForm, type PlaceSearch } from "@/components/event-form";
import { Button, cx } from "@/components/ui";
import type { DayEventType, TransportType } from "@/db/schema";
import {
  SNAP_MINUTES,
  clamp,
  formatSpan,
  gridWindow,
  moveSpan,
  packLanes,
  resizeSpan,
  snap,
  spanOf,
  toHhmm,
  toMinutes,
} from "@/lib/calendar";
import { EVENT_CATEGORIES } from "@/lib/event-categories";

/** Pixels per hour. Tall enough that a 15-minute block is still a target. */
const HOUR_PX = 56;

/** The clock column, wide enough for `00:00` in the mono face. */
const GUTTER_PX = 58;

/** A day column never gets thinner than this; the grid scrolls instead. */
const COLUMN_MIN_PX = { week: 120, day: 240 } as const;

const OUTSIDE_DAY_CLASS = "bg-sheet-2/65";

/**
 * Below this many pixels of *calendar* the week is unreadable even scrolling,
 * so the page hands over to a single day rather than pretending.
 */
const WEEK_FLOOR_PX = 560;

export type CalendarDay = {
  id: number;
  date: string;
  /** "Mon" — the column head's first line. */
  weekday: string;
  /** "12" — the column head's big number. */
  dayOfMonth: string;
  /** "Monday 12 May" — what the range label and every aria-label read. */
  longLabel: string;
  overnightPlaceName: string | null;
  /** 0 = Monday. What makes the week view a calendar week and not seven days. */
  weekdayIndex: number;
  /**
   * The derived stop this day belongs to, or null if nobody has said where the
   * group is sleeping. Derived on the server (rule 3) — never stored.
   */
  stop: { label: string; night: number; nights: number } | null;
  /**
   * A date drawn only to complete the Monday–Sunday frame — the trip does not
   * cover it. Shaded, and inert: nothing can be added to it or dropped on it,
   * because there is no `day` row behind it to write to.
   */
  outside: boolean;
  isToday: boolean;
};

export type CalendarEvent = {
  id: number;
  dayId: number;
  type: DayEventType;
  transportType: TransportType | null;
  /** Already fallen back to the place name, then the category's word. */
  title: string;
  placeName: string | null;
  time: string | null;
  endTime: string | null;
  allDay: boolean;
  hasNote: boolean;
  commentCount: number;
};

/** A drag in progress. Lives in a ref: it changes per pointer event. */
type Drag = {
  eventId: number;
  mode: "move" | "resize";
  /** How far into the block you took hold, so it doesn't jump under the cursor. */
  grabOffset: number;
  startX: number;
  startY: number;
  moved: boolean;
};

/** Where a drag currently says the event should land. */
type Landing = {
  eventId: number;
  dayId: number;
  time: string;
  endTime: string | null;
};

export function DaysCalendar({
  days,
  events,
  panels,
  tripThread,
  dayActions,
  removeDayControls,
  submitEvent,
  rescheduleEvent,
  moveEventToDay,
  searchPlaces,
}: {
  days: CalendarDay[];
  events: CalendarEvent[];
  /** One server-rendered detail panel per event id — facts, edit, delete, thread. */
  panels: Record<number, ReactNode>;
  /** The trip-wide thread, for the pane's second tab. */
  tripThread: ReactNode;
  /** "Add a day" — server-rendered, because it is a form. */
  dayActions: ReactNode;
  /** "Remove day", one per day id, shown in Day view where there is room. */
  removeDayControls: Record<number, ReactNode>;
  submitEvent: (formData: FormData) => Promise<void>;
  rescheduleEvent: (
    eventId: number,
    dayId: number,
    time: string,
    endTime: string | null,
  ) => Promise<void>;
  /** An all-day event has no time to drop, so moving it is a change of day only. */
  moveEventToDay: (eventId: number, fromDayId: number, toDayId: number) => Promise<void>;
  searchPlaces: PlaceSearch;
}) {
  const hasToday = days.some((d) => d.isToday);
  const todayIndex = Math.max(
    0,
    days.findIndex((d) => d.isToday),
  );

  const [view, setView] = useState<"day" | "week">("week");
  const [anchor, setAnchor] = useState(todayIndex);
  const [tooNarrow, setTooNarrow] = useState(false);
  const [hidden, setHidden] = useState<ReadonlySet<DayEventType>>(new Set());
  const [selected, setSelected] = useState<number | null>(null);
  const [tab, setTab] = useState<"event" | "notes">("event");
  const [adding, setAdding] = useState<{ dayId: number; time: string } | null>(null);
  const [announcement, setAnnouncement] = useState("");

  /*
   * A committed move is held locally until fresh server props confirm it, so
   * the block doesn't snap back to stale props between the action resolving and
   * the router applying the revalidated payload.
   * Last-write-wins (rule 7): what comes back is the truth, whoever else was
   * dragging at the same time.
   */
  const [optimistic, setOptimistic] = useState<Map<number, Landing>>(new Map());
  const [landing, setLanding] = useState<Landing | null>(null);
  const [, startTransition] = useTransition();

  const calRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Drag | null>(null);

  /*
   * How tall the pinned day heads and all-day strip are, measured rather than
   * guessed — the strip grows with whatever is in it.
   *
   * This exists because clicking a block focuses it, and the browser then
   * scrolls it into view aligned to the top of the scroll box, which is *under*
   * the sticky head: the event you just picked disappeared behind the all-day
   * strip. `scroll-padding-top` on the scroller is the fix — it tells that
   * scroll where the usable top of the box actually is.
   */
  const headRef = useRef<HTMLDivElement>(null);
  const [headHeight, setHeadHeight] = useState(0);
  useEffect(() => {
    const node = headRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => setHeadHeight(node.offsetHeight));
    observer.observe(node);
    setHeadHeight(node.offsetHeight);
    return () => observer.disconnect();
  }, []);

  const say = useCallback((message: string) => setAnnouncement(message), []);

  useEffect(() => {
    setOptimistic((prev) => {
      let next: Map<number, Landing> | null = null;
      for (const [id, pending] of prev) {
        const event = events.find((e) => e.id === id);
        if (
          event?.dayId === pending.dayId &&
          event.time === pending.time &&
          event.endTime === pending.endTime
        ) {
          next ??= new Map(prev);
          next.delete(id);
        }
      }
      return next ?? prev;
    });
  }, [events]);

  /* ---- what's on screen -------------------------------------------------- */

  /*
   * A drag is previewed on the block itself while it stays in its own column —
   * moving and resizing live, so there is nothing to reconcile on drop. It is
   * deliberately NOT previewed that way across columns: React would unmount the
   * node to re-parent it, and the pointer capture the drag depends on would go
   * with it. A cross-day drag shows a drop line in the target column instead.
   */
  const shown = useMemo(() => {
    const live = events.map((event) => {
      const pending = optimistic.get(event.id);
      const base = pending
        ? { ...event, dayId: pending.dayId, time: pending.time, endTime: pending.endTime }
        : event;
      return landing?.eventId === event.id && landing.dayId === base.dayId
        ? { ...base, time: landing.time, endTime: landing.endTime }
        : base;
    });
    return live.filter((e) => !hidden.has(e.type));
  }, [events, hidden, optimistic, landing]);

  const { startHour, endHour } = useMemo(() => gridWindow(shown), [shown]);
  const gridHeight = (endHour - startHour) * HOUR_PX;
  const minuteFloor = startHour * 60;

  const minutesToY = useCallback(
    (m: number) => ((m - minuteFloor) / 60) * HOUR_PX,
    [minuteFloor],
  );
  const yToMinutes = useCallback(
    (y: number) => minuteFloor + (y / HOUR_PX) * 60,
    [minuteFloor],
  );

  /* ---- narrow widths ------------------------------------------------------ */

  /*
   * Watching the element rather than the window catches the cases a resize
   * event never fires for — the pane opening, a container changing around it.
   */
  useEffect(() => {
    const node = calRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      setTooNarrow(node.clientWidth > 0 && node.clientWidth < WEEK_FLOOR_PX);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  /** Week is unavailable, not silently different — the button says why. */
  const effectiveView = tooNarrow ? "day" : view;

  /* ---- the now line ------------------------------------------------------- */

  /*
   * Read after mount, never during render: the server has no clock the client
   * agrees with to the minute, and a time rendered on both sides is a
   * hydration mismatch waiting for the turn of an hour.
   */
  const [nowMinutes, setNowMinutes] = useState<number | null>(null);
  useEffect(() => {
    const read = () => {
      const now = new Date();
      setNowMinutes(now.getHours() * 60 + now.getMinutes());
    };
    read();
    const timer = setInterval(read, 60_000);
    return () => clearInterval(timer);
  }, []);

  /* ---- committing ---------------------------------------------------------- */

  const commit = useCallback(
    (next: Landing) => {
      setOptimistic((prev) => new Map(prev).set(next.eventId, next));
      startTransition(async () => {
        await rescheduleEvent(next.eventId, next.dayId, next.time, next.endTime);
      });
    },
    [rescheduleEvent],
  );

  /* ---- drag ---------------------------------------------------------------- */

  /** Which day column the pointer is over. Horizontal position decides it. */
  const columnAt = (x: number) => {
    const columns = gridRef.current?.querySelectorAll<HTMLElement>("[data-day-column]");
    if (!columns) return null;
    for (const column of columns) {
      const rect = column.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right) {
        return { dayId: Number(column.dataset.dayColumn), top: rect.top };
      }
    }
    return null;
  };

  const onBlockPointerDown = (
    ev: ReactPointerEvent<HTMLElement>,
    event: CalendarEvent,
    mode: "move" | "resize",
  ) => {
    if (ev.button !== 0) return;
    const span = spanOf(event);
    if (!span) return;
    // Measured on the block, which is `currentTarget` for a move and the grip
    // for a resize — where a resize doesn't use the offset at all.
    const rect = ev.currentTarget.getBoundingClientRect();
    dragRef.current = {
      eventId: event.id,
      mode,
      grabOffset: snap(yToMinutes(ev.clientY - rect.top) - minuteFloor),
      startX: ev.clientX,
      startY: ev.clientY,
      moved: false,
    };
    ev.currentTarget.setPointerCapture(ev.pointerId);
  };

  const onBlockPointerMove = (
    ev: ReactPointerEvent<HTMLElement>,
    event: CalendarEvent,
  ) => {
    const drag = dragRef.current;
    if (!drag || drag.eventId !== event.id) return;
    // A few pixels of slop, so a click with an unsteady hand stays a click.
    if (!drag.moved && Math.hypot(ev.clientX - drag.startX, ev.clientY - drag.startY) < 4) {
      return;
    }
    drag.moved = true;

    const span = spanOf(event);
    if (!span) return;
    const hit = columnAt(ev.clientX);
    if (!hit) return;

    const at = clamp(snap(yToMinutes(ev.clientY - hit.top)), 0, 24 * 60);
    const next: Landing =
      drag.mode === "resize"
        ? { eventId: event.id, dayId: event.dayId, ...resizeSpan(span, at) }
        : { eventId: event.id, dayId: hit.dayId, ...moveSpan(span, at - drag.grabOffset) };

    setLanding((prev) =>
      prev &&
      prev.dayId === next.dayId &&
      prev.time === next.time &&
      prev.endTime === next.endTime
        ? prev
        : next,
    );
  };

  const onBlockPointerUp = (event: CalendarEvent) => {
    const drag = dragRef.current;
    dragRef.current = null;
    const dropped = landing;
    setLanding(null);
    if (!drag) return;

    // A press that never moved is a click: open the event rather than write it.
    if (!drag.moved || !dropped) {
      select(event.id);
      return;
    }

    commit(dropped);
    keptSelection.current = true;
    setSelected(event.id);
    setTab("event");
    const day = days.find((d) => d.id === dropped.dayId);
    say(
      `${event.title} moved to ${day?.longLabel ?? "another day"}, ` +
        `${formatSpan({ ...dropped, allDay: false })}.`,
    );
  };

  /** The keyboard's equal of the drag: ↑/↓ a quarter hour, shift+←/→ a day. */
  const onBlockKeyDown = (
    ev: ReactKeyboardEvent<HTMLElement>,
    event: CalendarEvent,
  ) => {
    const span = spanOf(event);
    if (!span) return;

    if (ev.key === "ArrowUp" || ev.key === "ArrowDown") {
      ev.preventDefault();
      const moved = moveSpan(
        span,
        span.start + (ev.key === "ArrowUp" ? -SNAP_MINUTES : SNAP_MINUTES),
      );
      commit({ eventId: event.id, dayId: event.dayId, ...moved });
      say(`${event.title} now ${formatSpan({ ...moved, allDay: false })}.`);
      return;
    }

    if (ev.shiftKey && (ev.key === "ArrowLeft" || ev.key === "ArrowRight")) {
      ev.preventDefault();
      const from = days.findIndex((d) => d.id === event.dayId);
      const to = days[from + (ev.key === "ArrowLeft" ? -1 : 1)];
      // Off the end of the trip, or onto a padding column: both are "there is
      // no day there", and both simply refuse.
      if (!to || to.outside) return;
      commit({
        eventId: event.id,
        dayId: to.id,
        time: toHhmm(span.start),
        endTime: span.open ? null : toHhmm(span.end),
      });
      say(`${event.title} moved to ${to.longLabel}.`);
    }
  };

  /* ---- all-day pills -------------------------------------------------------- */

  /*
   * An all-day event has no time to drop, so its drag is a change of day and
   * nothing else — which is exactly what `insertEventAt` already does, times
   * carried over untouched. It goes through that rather than through
   * `rescheduleEvent`, which would have to invent a start time to write.
   */
  const [allDayDrag, setAllDayDrag] = useState<number | null>(null);
  const [allDayOver, setAllDayOver] = useState<number | null>(null);

  /* ---- selection and adding -------------------------------------------------- */

  /*
   * The pane is the selection, not a switch of its own (ticket 138): picking an
   * event is what opens it and clicking off the event is what closes it, so
   * there is nothing to hide by hand. `keptSelection` is how the click that
   * made the selection survives the deselect handler it bubbles into.
   */
  const keptSelection = useRef(false);

  const select = (id: number) => {
    keptSelection.current = true;
    setSelected(id);
    setTab("event");
  };

  const onCalendarClick = () => {
    if (keptSelection.current) {
      keptSelection.current = false;
      return;
    }
    setSelected(null);
  };

  const openAdd = (dayId: number, minutes: number) => {
    setAdding({ dayId, time: toHhmm(clamp(snap(minutes), 0, 24 * 60 - SNAP_MINUTES)) });
  };

  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (adding && !dialog.open) dialog.showModal();
    if (!adding && dialog.open) dialog.close();
  }, [adding]);

  /* ---- paging ----------------------------------------------------------------- */

  /*
   * A week is a *calendar* week, Monday to Sunday — not seven days counted from
   * wherever the trip happens to start. Paging by seven from day one meant the
   * columns said Wed–Tue, and a row of dates that doesn't line up with the week
   * everyone else is using is a row you have to read twice. The first and last
   * pages of a trip are therefore short: a trip starting on a Wednesday opens
   * on a five-column week, which is the truth about that week.
   */
  const pages = useMemo(() => {
    // Day view never lands on a padding day: there is nothing there to show.
    if (effectiveView === "day") return days.filter((d) => !d.outside).map((d) => [d]);
    const weeks: CalendarDay[][] = [];
    for (const day of days) {
      if (weeks.length === 0 || day.weekdayIndex === 0) weeks.push([day]);
      else weeks[weeks.length - 1].push(day);
    }
    return weeks;
  }, [days, effectiveView]);

  // The anchor stays a *day*, so switching between Day and Week keeps you where
  // you were rather than jumping to whichever page number matched.
  const anchorDay = days[clamp(anchor, 0, days.length - 1)];
  const pageIndex = Math.max(
    0,
    pages.findIndex((page) => page.some((d) => d.id === anchorDay?.id)),
  );
  const shownDays = pages[pageIndex] ?? [];

  const goTo = (page: CalendarDay[] | undefined) => {
    if (page?.[0]) setAnchor(days.findIndex((d) => d.id === page[0].id));
  };
  const goPrev = () => goTo(pages[pageIndex - 1]);
  const goNext = () => goTo(pages[pageIndex + 1]);

  /*
   * The arrows leave rather than grey out at the ends of the trip. A disabled
   * control still says "there is more that way, just not for you", which is the
   * wrong thing to say about the first and last day of a trip — there is
   * nothing that way at all, and the absence is the signal.
   */
  const canPrev = pageIndex > 0;
  const canNext = pageIndex < pages.length - 1;

  /*
   * The label names the *trip's* range on this page, not the frame's. A week
   * padded out to Monday would otherwise announce dates the trip has nothing
   * on, which is the opposite of what a heading is for.
   */
  const labelled = shownDays.filter((d) => !d.outside);
  const rangeLabel =
    labelled.length === 1
      ? labelled[0].longLabel
      : `${labelled[0]?.longLabel} – ${labelled[labelled.length - 1]?.longLabel}`;

  const selectedEvent = selected === null ? null : events.find((e) => e.id === selected);

  const rowStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: `${GUTTER_PX}px repeat(${shownDays.length}, minmax(${COLUMN_MIN_PX[effectiveView]}px, 1fr))`,
    minWidth: "max-content",
  };

  /* ---- render ------------------------------------------------------------------ */

  return (
    <div className="rounded-md border border-rule bg-sheet">
      <div className="flex flex-wrap items-center gap-2 border-b border-rule bg-sheet-2 px-3 py-2">
        <Button
          onClick={() => setAnchor(todayIndex)}
          disabled={!hasToday}
          title={hasToday ? undefined : "The trip isn't running today"}
        >
          Today
        </Button>
        {canPrev ? (
          <Button variant="ghost" onClick={goPrev} aria-label="Earlier days">
            ‹
          </Button>
        ) : null}
        {canNext ? (
          <Button variant="ghost" onClick={goNext} aria-label="Later days">
            ›
          </Button>
        ) : null}
        <p className="min-w-[11rem] text-sm font-semibold" aria-live="polite">
          {rangeLabel}
        </p>

        <div className="flex-1" />

        {/* The key for the block colours, which is also the filter (ticket 90).
            Each swatch carries its word, so the colours are a shortcut and
            never the only signal. */}
        <div role="group" aria-label="Filter by type" className="flex flex-wrap gap-1">
          {(Object.keys(EVENT_CATEGORIES) as DayEventType[]).map((type) => {
            const category = EVENT_CATEGORIES[type];
            const on = !hidden.has(type);
            return (
              <button
                key={type}
                type="button"
                aria-pressed={on}
                onClick={() =>
                  setHidden((prev) => {
                    const next = new Set(prev);
                    if (!next.delete(type)) next.add(type);
                    return next;
                  })
                }
                className={cx(
                  "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.06em]",
                  category.row,
                  on ? "text-ink ring-1 ring-pen" : "text-ink-faint line-through",
                )}
              >
                <span aria-hidden className={cx("size-2 rounded-sm", category.dot)} />
                {category.label}
              </button>
            );
          })}
        </div>

        <div className="flex overflow-hidden rounded-md border border-rule-strong">
          {(["day", "week"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={effectiveView === option}
              disabled={option === "week" && tooNarrow}
              title={
                option === "week" && tooNarrow ? "The week needs a wider window" : undefined
              }
              onClick={() => setView(option)}
              className={cx(
                "px-3 py-1 font-mono text-[11px] uppercase tracking-[0.06em] disabled:opacity-50",
                effectiveView === option
                  ? "bg-pen font-bold text-sheet"
                  : "bg-sheet text-ink-soft hover:bg-sheet-3",
              )}
            >
              {option === "day" ? "Day" : "Week"}
            </button>
          ))}
        </div>

        {dayActions}
        <Button
          variant="primary"
          onClick={() =>
            openAdd(
              // The first day of the page the trip is actually on — never one
              // of the padding columns, which have no row to write to.
              (labelled[0] ?? days.find((d) => !d.outside) ?? days[0]).id,
              9 * 60,
            )
          }
        >
          Add event
        </Button>
      </div>

      {/* A one-line explanation whenever the layout has decided something for
          you — the alternative is a week view that quietly became a day. */}
      {tooNarrow ? (
        <p className="border-b border-highlight bg-highlight-soft px-3 py-1.5 text-xs text-ink-soft">
          Narrow window — one day at a time.
        </p>
      ) : null}

      {/*
       * The pane's 20rem is the difference between five day columns and seven,
       * so it is only there when it has something to say: an event is picked.
       * Nothing is picked by default and clicking off the event puts the width
       * back — the calendar is what the page is for.
       */}
      <div
        className={cx(
          "grid grid-cols-1",
          selectedEvent && "lg:grid-cols-[minmax(0,1fr)_20rem]",
        )}
      >
        <div
          ref={calRef}
          onClick={onCalendarClick}
          className="min-w-0 border-b border-rule lg:border-r lg:border-b-0"
        >
          {/*
           * ONE scroll container for both axes, and that is load-bearing.
           * `position: sticky` resolves against the nearest scrolling
           * ancestor, so a horizontal scroller wrapped around a separate
           * vertical one leaves the hour gutter sticking to a box that never
           * moves sideways — the clock scrolls away with the days, which is the
           * one thing pinning it was for. One box scrolls both ways: the day
           * heads stick to the top, the gutter sticks to the left, and both are
           * measured against the same scroll offset.
           */}
          <div
            className="max-h-[70vh] overflow-auto"
            style={{ scrollPaddingTop: headHeight }}
          >
            {/* The shadow is what makes the pinned head read as a layer over
                the grid rather than as part of it — without it, hours sliding
                underneath look like a rendering fault. */}
            {/* One intrinsic-width wrapper owns every calendar row. The head,
                all-day band, and timed grid must share the same `1fr` space;
                otherwise each `w-max` row resolves that space independently. */}
            <div className="w-max min-w-full">
            <div
              ref={headRef}
              className="sticky top-0 z-30 shadow-[0_2px_5px_rgb(0_0_0/0.07)]"
            >
            <div style={rowStyle} className="border-b border-rule bg-sheet">
              <div className="sticky left-0 z-20 border-r border-rule bg-sheet" />
              {shownDays.map((day) => (
                <div
                  key={day.id}
                  className={cx(
                    "border-l border-rule px-2 py-1.5 text-center first:border-l-0",
                    // A day the trip doesn't cover is dimmed in the head as
                    // well as in the column, so the two read as one thing.
                    day.outside && `${OUTSIDE_DAY_CLASS} text-ink-faint`,
                    landing?.dayId === day.id && "bg-pen-soft",
                  )}
                >
                  <p className="typed">{day.weekday}</p>
                  <p
                    className={cx(
                      "nums text-lg font-semibold",
                      day.isToday &&
                        "mx-auto inline-block min-w-[1.7em] rounded-full bg-pen px-1 text-sheet",
                    )}
                  >
                    {day.dayOfMonth}
                  </p>
                  {effectiveView === "day" ? (
                    <div className="mt-1 flex justify-center">
                      {removeDayControls[day.id]}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            {/* The all-day band. Things that happen *on* a day rather than at a
                time keep their own strip above the clock — the alternative was
                making a time mandatory, which would mean inventing one for
                every row that hasn't got one. */}
            <div style={rowStyle} className="border-b border-rule bg-sheet-2">
              <div className="sticky left-0 z-20 border-r border-rule bg-sheet-2 px-2 py-1.5 text-right">
                <span className="typed">All day</span>
              </div>
              {shownDays.map((day) => (
                <div
                  key={day.id}
                  onDragOver={(ev) => {
                    if (allDayDrag === null || day.outside) return;
                    ev.preventDefault();
                    setAllDayOver(day.id);
                  }}
                  onDragLeave={() => setAllDayOver((d) => (d === day.id ? null : d))}
                  onDrop={(ev) => {
                    ev.preventDefault();
                    const moving = events.find((e) => e.id === allDayDrag);
                    setAllDayDrag(null);
                    setAllDayOver(null);
                    if (!moving || moving.dayId === day.id || day.outside) return;
                    startTransition(async () => {
                      await moveEventToDay(moving.id, moving.dayId, day.id);
                    });
                    say(`${moving.title} moved to ${day.longLabel}.`);
                  }}
                  className={cx(
                    "grid min-h-8 content-start gap-1 border-l border-rule p-1 first:border-l-0",
                    day.outside && OUTSIDE_DAY_CLASS,
                    allDayOver === day.id && "bg-pen-soft",
                  )}
                >
                  {shown
                    .filter((e) => e.dayId === day.id && !spanOf(e))
                    .map((event) => (
                      <button
                        key={event.id}
                        type="button"
                        draggable
                        onDragStart={() => setAllDayDrag(event.id)}
                        onDragEnd={() => {
                          setAllDayDrag(null);
                          setAllDayOver(null);
                        }}
                        onClick={() => select(event.id)}
                        aria-pressed={selected === event.id}
                        aria-label={`${event.title}, all day, ${day.longLabel}`}
                        className={cx(
                          "truncate rounded-sm border border-l-4 px-1.5 py-0.5 text-left text-xs",
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
            </div>

            {/* An hour's label is centred *on* its line, so half of the first
                one sits above the top of the grid and half of the last below
                it — which is why the first hour read as hidden behind the
                all-day strip. The row is inset by half a label so both ends
                have somewhere to be. It has to be on the row, not on a column:
                every block is positioned inside a column, so anything that
                moved one and not the others would move the clock away from the
                times. */}
            <div style={rowStyle} ref={gridRef} className="mt-2.5 mb-2.5">
              <div
                className="sticky left-0 z-20 border-r border-rule bg-sheet"
                style={{ height: gridHeight }}
              >
                <div className="relative h-full">
                  {Array.from({ length: endHour - startHour + 1 }, (_, i) => (
                    <span
                      key={i}
                      /* Not `.typed`: at 11px with 0.08em of tracking the clock
                         was the smallest text on a page it is meant to be read
                         off. Same mono face, two sizes up, tracking eased. */
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
                  events={shown.filter((e) => e.dayId === day.id && spanOf(e))}
                  selected={selected}
                  landing={landing}
                  nowMinutes={day.isToday ? nowMinutes : null}
                  minutesToY={minutesToY}
                  yToMinutes={yToMinutes}
                  onAdd={openAdd}
                  onPointerDown={onBlockPointerDown}
                  onPointerMove={onBlockPointerMove}
                  onPointerUp={onBlockPointerUp}
                  onKeyDown={onBlockKeyDown}
                />
              ))}
            </div>
            </div>
          </div>
        </div>

        {selectedEvent ? (
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
            {/* Clicking off the event closes the pane, but only once you know
                that — the ✕ is the visible way out, where a panel's close
                always is. */}
            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label="Close the event pane"
              title="Close"
              className="border-b-2 border-transparent px-3 py-2 text-sm text-ink-soft hover:text-ink"
            >
              ✕
            </button>
          </div>

          <div role="tabpanel" className="max-h-[70vh] overflow-y-auto p-3">
            {tab === "notes" ? tripThread : panels[selectedEvent.id]}
          </div>
        </aside>
        ) : null}
      </div>

      {/* Every gesture says what it did: a drag that reports itself only
          visually reports itself to some of the group. */}
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <dialog
        ref={dialogRef}
        onClose={() => setAdding(null)}
        onClick={(ev) => {
          if (ev.target === dialogRef.current) setAdding(null);
        }}
        className="m-auto w-full max-w-lg rounded-md border border-rule bg-sheet p-0 text-ink backdrop:bg-black/40"
      >
        {adding ? (
          <>
            <div className="flex items-center justify-between border-b border-dotted border-rule-strong px-4 py-3">
              <h2 className="font-display text-base font-semibold">
                Add an event — {days.find((d) => d.id === adding.dayId)?.longLabel},{" "}
                {adding.time}
              </h2>
              <button
                type="button"
                onClick={() => setAdding(null)}
                aria-label="Close"
                className="rounded-sm px-2 text-lg leading-none text-ink-faint hover:text-ink"
              >
                ×
              </button>
            </div>
            {/* Submitting dismisses the dialog; the action revalidates the page
                underneath it. Same contract as `Sheet`. */}
            <div className="p-4" onSubmit={() => setTimeout(() => setAdding(null), 0)}>
              <EventForm
                action={submitEvent}
                searchPlaces={searchPlaces}
                defaults={{
                  dayId: adding.dayId,
                  time: adding.time,
                  // An hour long by default — the commonest answer, and the
                  // bottom edge is right there if it's wrong.
                  endTime: toHhmm(Math.min((toMinutes(adding.time) ?? 540) + 60, 24 * 60)),
                }}
              />
            </div>
          </>
        ) : null}
      </dialog>
    </div>
  );
}

/**
 * One day's slice of the clock: the painted rules, the catcher that turns a
 * click into a quarter hour, and the blocks.
 */
function DayColumn({
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

  /*
   * Packing decides *where* a block goes; it deliberately does not decide the
   * order they are rendered in. `packLanes` returns them sorted by start, and
   * rendering in that order meant that dragging one event past another's start
   * re-sorted the list, which made React re-insert the keyed node — and Chrome
   * drops pointer capture on an element that is taken out of the document and
   * put back. The drag went dead exactly at the moment two events crossed,
   * which is precisely when you are most likely to be dragging one. Rendering
   * in a fixed order by id, and letting `top`/`left` do all the moving, means
   * the node the pointer is captured on never moves in the tree at all.
   */
  const byId = new Map(events.map((e) => [e.id, e]));
  const laneOf = new Map(
    packLanes(
      events.flatMap((e) => {
        const span = spanOf(e);
        return span ? [{ id: e.id, start: span.start, end: span.end }] : [];
      }),
    ).map((b) => [b.id, b]),
  );
  const packed = [...laneOf.values()].sort((a, b) => a.id - b.id);

  /* The block for a cross-day drag stays in its own column (see the note in
     `shown`), so the target column shows where it would land instead. */
  const incoming =
    landing && landing.dayId === day.id && !byId.has(landing.eventId) ? landing : null;

  /*
   * A day the trip doesn't cover is a shaded, empty column and nothing else.
   * It carries no `data-day-column`, which is what `columnAt` scans, so a drag
   * cannot land on it — the guard is the absence of the hook rather than a
   * check somebody has to remember to write.
   */
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
      {/*
       * The rules are painted, not built from elements: hour solid, half
       * lighter, quarter lightest — so a quarter-hour target is visible before
       * you aim at it, and a week costs three gradients rather than 500 divs.
       *
       * The two sub-hour rules were knocked back hard from the first cut (28%
       * and 50% of `--rule-2`): four horizontals an hour across seven columns,
       * over a sheet that is already ruled behind them, read as hatching. They
       * only have to be findable when you are aiming at one.
       */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: [
            `repeating-linear-gradient(to bottom, color-mix(in srgb, var(--rule-2) 12%, transparent) 0 1px, transparent 1px ${HOUR_PX / 4}px)`,
            `repeating-linear-gradient(to bottom, color-mix(in srgb, var(--rule-2) 26%, transparent) 0 1px, transparent 1px ${HOUR_PX / 2}px)`,
            `repeating-linear-gradient(to bottom, var(--rule) 0 1px, transparent 1px ${HOUR_PX}px)`,
          ].join(","),
        }}
      />

      {/* A click anywhere empty is "add one here" — at the quarter hour the
          cursor is actually on, not the hour it is nearest. Reached by keyboard
          it has no coordinates to read, so it opens at nine, which is where the
          toolbar's own Add event starts too. */}
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

      {hover !== null && !landing ? (
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

      {nowMinutes !== null ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-red"
          style={{ top: minutesToY(nowMinutes) }}
        />
      ) : null}

      {packed.map(({ id, start, end, lane, lanes }) => {
        const event = byId.get(id)!;
        const span = spanOf(event)!;
        const top = minutesToY(start);
        const boxHeight = Math.max(minutesToY(end) - top - 2, 16);
        const short = boxHeight < 46;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={selected === id}
            aria-label={`${event.title}, ${formatSpan(event)}, ${day.longLabel}`}
            onPointerDown={(ev) => onPointerDown(ev, event, "move")}
            onPointerMove={(ev) => onPointerMove(ev, event)}
            onPointerUp={() => onPointerUp(event)}
            onPointerCancel={() => onPointerUp(event)}
            onKeyDown={(ev) => onKeyDown(ev, event)}
            style={{
              top,
              height: boxHeight,
              left: `calc(${(lane / lanes) * 100}% + 2px)`,
              width: `calc(${100 / lanes}% - 5px)`,
              // Without this a touch drag scrolls the page instead.
              touchAction: "none",
              // An end nobody has written is drawn, not known: the dashes say
              // the bottom edge is a guess and the handle is how to fix it.
              borderBottomStyle: span.open ? "dashed" : undefined,
            }}
            className={cx(
              // `pb-2.5` keeps the last line of text off the grip pill, and
              // `scroll-mt-32` keeps the block clear of the sticky head when
              // focusing it scrolls it into view (see `scrollPaddingTop`).
              "absolute z-[2] flex scroll-mt-32 flex-col justify-start overflow-hidden rounded-md border border-l-4 px-1.5 pt-0.5 pb-2.5 text-left text-xs leading-tight shadow-card",
              EVENT_CATEGORIES[event.type].block,
              selected === id && "z-[4] outline-2 outline-ink",
              landing?.eventId === id && "opacity-70",
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

            {/* The bottom edge resizes. A span rather than a second button,
                because a button inside a button is not valid markup — the
                keyboard's way to the same thing is ↑/↓ on the block.

                The short bar drawn inside it is the mockup's grip pill, and it
                is not decoration: without it the handle is an invisible strip
                of pixels, and an affordance nobody can see is one only the
                people who already knew about it will use. `currentColor` at
                low opacity means it inherits each category's ink for free. */}
            <span
              aria-hidden
              onPointerDown={(ev) => {
                ev.stopPropagation();
                onPointerDown(ev, event, "resize");
              }}
              onPointerMove={(ev) => onPointerMove(ev, event)}
              onPointerUp={() => onPointerUp(event)}
              className={cx(
                "absolute inset-x-0 bottom-0 cursor-ns-resize",
                short ? "h-1.5" : "h-2",
              )}
            >
              <span className="absolute bottom-[2px] left-1/2 h-[2px] w-[22px] -translate-x-1/2 rounded-full bg-current opacity-35" />
            </span>
          </button>
        );
      })}
    </div>
  );
}
