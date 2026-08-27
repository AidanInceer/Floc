"use client";

/**
 * Days as a calendar (ticket 103) — hours down, days across, events as blocks.
 * Owns geometry/gestures only; `days/page.tsx` owns the content (detail panel,
 * trip thread) as server-rendered nodes, since those are full of Server Actions.
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
import { PlacePicker, type PlacePickerResult } from "@/components/place-picker";
import { Menu } from "@/components/client-ui";
import { Button, Field, Input, cx, menuItemClass } from "@/components/ui";
import type { DayEventType, TransportType } from "@/db/schema";
import {
  LAST_START_MINUTE,
  NUDGE_MINUTES,
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
import {
  bandRuns as runsOfBand,
  runBoundsAt,
  uncoveredBy,
  type BandSpan,
} from "@/lib/overnight-band";

/** Pixels per hour. Tall enough that a 15-minute block is still a target. */
const HOUR_PX = 56;

/** Wide enough for `00:00`, and for the band's own label (ticket 141). */
const GUTTER_PX = 66;

/** A day column never gets thinner than this; the grid scrolls instead. */
const COLUMN_MIN_PX = { week: 120, day: 240 } as const;

const OUTSIDE_DAY_CLASS = "bg-sheet-2/65";

/** Below this width the week is unreadable even scrolling; falls back to Day. */
const WEEK_FLOOR_PX = 560;

export type CalendarDay = {
  id: number;
  date: string;
  weekday: string;
  dayOfMonth: string;
  longLabel: string;
  /** Null is a real answer: nobody has decided yet. */
  overnightPlaceName: string | null;
  /** Sent back on extend, so a stay keeps its geocoded `place` row. */
  overnightPlaceId: number | null;
  /** 0 = Monday. */
  weekdayIndex: number;
  /** Padding for the Monday–Sunday frame; no `day` row behind it. */
  outside: boolean;
  isToday: boolean;
};

export type CalendarEvent = {
  id: number;
  dayId: number;
  type: DayEventType;
  transportType: TransportType | null;
  /** Falls back to place name, then category word — never blank. */
  title: string;
  placeName: string | null;
  time: string | null;
  endTime: string | null;
  allDay: boolean;
  hasNote: boolean;
  commentCount: number;
};

/** Structural, not imported from the action — avoids pulling `"use server"` into the client bundle. */
export type OvernightPlace =
  | { placeId: number }
  | {
      name: string;
      providerId?: string | null;
      lat?: number | null;
      lng?: number | null;
      countryCode?: string | null;
    };

/** A band gesture in progress. Dates, not day ids: the page can turn under it. */
type BandDrag = {
  /** "paint" starts on undecided days; "extend" starts on a run's end handle. */
  mode: "paint" | "extend";
  /** The end that stays put. */
  anchorDate: string;
  /** What a press-without-a-drag opens. */
  pressedDate: string;
  placeId: number | null;
  placeName: string | null;
  /** The run before the drag — what a shrink has to clear. */
  runStart: string;
  runEnd: string;
  startX: number;
  moved: boolean;
  /** On the ref, not state: a fast drag can land its last move and release in one task. */
  span: BandSpan | null;
};

/** How close to the calendar's edge a drag has to get before the page turns. */
const EDGE_PX = 44;

/** Lives in a ref: changes per pointer event. */
type Drag = {
  eventId: number;
  mode: "move" | "resize";
  /** So the block doesn't jump under the cursor. */
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
  removeDayControls,
  submitEvent,
  rescheduleEvent,
  moveEventToDay,
  setOvernight,
  searchPlaces,
}: {
  days: CalendarDay[];
  events: CalendarEvent[];
  /** Server-rendered detail panel per event id. */
  panels: Record<number, ReactNode>;
  tripThread: ReactNode;
  removeDayControls: Record<number, ReactNode>;
  submitEvent: (formData: FormData) => Promise<void>;
  rescheduleEvent: (
    eventId: number,
    dayId: number,
    time: string,
    endTime: string | null,
  ) => Promise<void>;
  /** All-day has no time to drop, so this is a change of day only. */
  moveEventToDay: (eventId: number, fromDayId: number, toDayId: number) => Promise<void>;
  setOvernight: (
    startDate: string,
    endDate: string,
    place: OvernightPlace | null,
  ) => Promise<void>;
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
  const typeCount = Object.keys(EVENT_CATEGORIES).length;
  const hiddenCount = hidden.size;
  const [selected, setSelected] = useState<number | null>(null);
  const [tab, setTab] = useState<"event" | "notes">("event");
  const [adding, setAdding] = useState<{ dayId: number; time: string } | null>(null);
  const [announcement, setAnnouncement] = useState("");

  // Held locally until fresh server props confirm it, so the block doesn't
  // snap back to stale props while the action is in flight (rule 7).
  const [optimistic, setOptimistic] = useState<Map<number, Landing>>(new Map());
  const [landing, setLanding] = useState<Landing | null>(null);
  const [, startTransition] = useTransition();

  const calRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  /** What a band drag measures its edges against. */
  const scrollerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Drag | null>(null);

  // Measured, not guessed — the strip grows with its contents. Feeds
  // `scroll-padding-top` so focusing a block doesn't scroll it under the
  // sticky head (the browser aligns focus-scroll to the box's raw top).
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

  // A same-column drag previews live on the block itself. Cross-column isn't:
  // re-parenting would unmount the node and drop the pointer capture the drag
  // depends on. Shows a drop line in the target column instead.
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

  // Watches the element, not the window — catches cases a resize event never
  // fires for, like the pane opening.
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

  // Read after mount, never during render: a time rendered on both sides is a
  // hydration mismatch waiting for the turn of an hour.
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

  const commit = useCallback(
    (next: Landing) => {
      setOptimistic((prev) => new Map(prev).set(next.eventId, next));
      startTransition(async () => {
        await rescheduleEvent(next.eventId, next.dayId, next.time, next.endTime);
      });
    },
    [rescheduleEvent],
  );

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
    // A drag moves the event and nothing else (ticket 141): it must not open
    // the pane, which is what a plain click is for. `keptSelection` still goes
    // up, so the release's click doesn't clear a selection made before it.
    keptSelection.current = true;
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
        span.start + (ev.key === "ArrowUp" ? -NUDGE_MINUTES : NUDGE_MINUTES),
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

  // An all-day event has no time to drop, so its drag goes through
  // `insertEventAt` (a day change, times untouched) rather than `rescheduleEvent`.
  const [allDayDrag, setAllDayDrag] = useState<number | null>(null);
  const [allDayOver, setAllDayOver] = useState<number | null>(null);

  // `bandSpan` is the drag in progress, drawn dashed and written to nothing.
  // `pendingBand` is a write that's gone but whose props haven't come back yet,
  // so the bar doesn't flicker to the old answer in between (rule 7).
  // `banding` is the dialog: the span it opened on.
  const bandRowRef = useRef<HTMLDivElement>(null);
  const bandDragRef = useRef<BandDrag | null>(null);
  const [bandSpan, setBandSpan] = useState<BandSpan | null>(null);
  const [pendingBand, setPendingBand] = useState<BandSpan | null>(null);
  const [banding, setBanding] = useState<BandSpan | null>(null);
  /** -1 or 1 while a drag is held at an edge; the page turns on a timer. */
  const [edgePage, setEdgePage] = useState<-1 | 0 | 1>(0);

  // The pane is the selection, not a switch of its own (ticket 138).
  // `keptSelection` is how the click that made the selection survives the
  // deselect handler it bubbles into.
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
    setAdding({ dayId, time: toHhmm(clamp(snap(minutes), 0, LAST_START_MINUTE)) });
  };

  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (adding && !dialog.open) dialog.showModal();
    if (!adding && dialog.open) dialog.close();
  }, [adding]);

  // A week is a *calendar* week, Monday to Sunday — not seven days counted from
  // wherever the trip starts, or the columns would say Wed–Tue. The first and
  // last pages of a trip are therefore short.
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
  // Memoised because the band's runs are derived from it: a fresh `[]` every
  // render would rebuild them every render.
  const shownDays = useMemo(() => pages[pageIndex] ?? [], [pages, pageIndex]);

  const goTo = (page: CalendarDay[] | undefined) => {
    if (page?.[0]) setAnchor(days.findIndex((d) => d.id === page[0].id));
  };
  const goPrev = () => goTo(pages[pageIndex - 1]);
  const goNext = () => goTo(pages[pageIndex + 1]);

  // The arrows grey out at the ends of the trip rather than disappearing —
  // a control that leaves reshuffles the toolbar under the cursor mid-page.
  const canPrev = pageIndex > 0;
  const canNext = pageIndex < pages.length - 1;

  // The trip's range on this page, not the padded frame's.
  const labelled = shownDays.filter((d) => !d.outside);
  const rangeLabel =
    labelled.length === 1
      ? labelled[0].longLabel
      : `${labelled[0]?.longLabel} – ${labelled[labelled.length - 1]?.longLabel}`;

  const tripDays = useMemo(() => days.filter((d) => !d.outside), [days]);
  const dateOfDay = useCallback(
    (dayId: number) => days.find((d) => d.id === dayId)?.date ?? null,
    [days],
  );

  /** The place a day shows *right now*, drag and pending write included. */
  const bandOverlay = bandSpan ?? pendingBand;
  const overlayIsDrag = bandSpan !== null;

  /* The bars — the grouping itself lives in `lib/overnight-band.ts`. */
  const bandRuns = useMemo(
    () => runsOfBand(shownDays, days, bandOverlay, overlayIsDrag),
    [shownDays, days, bandOverlay, overlayIsDrag],
  );

  /* A write is confirmed when the props say what the overlay was claiming. */
  useEffect(() => {
    setPendingBand((pending) => {
      if (!pending) return pending;
      const covered = days.filter(
        (d) => !d.outside && d.date >= pending.start && d.date <= pending.end,
      );
      const emptied = days.filter(
        (d) =>
          !d.outside &&
          pending.uncovered?.some(([from, to]) => d.date >= from && d.date <= to),
      );
      const landed =
        covered.length > 0 &&
        covered.every((d) => d.overnightPlaceId === pending.placeId) &&
        emptied.every((d) => d.overnightPlaceId === null);
      return landed ? null : pending;
    });
  }, [days]);

  // A drag held at the edge turns the page and keeps going — a stay of ten
  // nights doesn't fit in a calendar week.
  useEffect(() => {
    if (edgePage === 0) return;
    const timer = setInterval(() => {
      // A release the row never saw (the pointer left the window, the tab lost
      // it) must not leave the calendar turning pages by itself.
      if (!bandDragRef.current) return setEdgePage(0);
      const target = pages[pageIndex + edgePage];
      if (target?.[0]) setAnchor(days.findIndex((d) => d.id === target[0].id));
    }, 550);
    return () => clearInterval(timer);
  }, [edgePage, pageIndex, pages, days]);

  const commitBand = useCallback(
    (span: BandSpan, place: OvernightPlace | null, cleared: [string, string][]) => {
      /*
       * The overlay can only stand in for an answer whose id is already known —
       * a clear, or an extend of a run that has one. A place picked from the
       * search has no row until the server makes it, so there is no id to hold
       * the days against, and an overlay that can never match what comes back
       * is one that never lifts. That write waits for its props like any other.
       */
      setPendingBand(
        place === null
          ? { ...span, placeId: null, placeName: null, uncovered: cleared }
          : "placeId" in place
            ? { ...span, placeId: place.placeId, uncovered: cleared }
            : null,
      );
      startTransition(async () => {
        // The days that fell out of a shrinking run go first: they are the same
        // column, and writing the survivors first would leave the run briefly
        // claiming days it has just lost.
        for (const [from, to] of cleared) await setOvernight(from, to, null);
        await setOvernight(span.start, span.end, place);
      });
    },
    [setOvernight],
  );

  const openBandDialog = (span: BandSpan) => {
    keptSelection.current = true;
    setBanding(span);
  };

  const startBandDrag = (ev: ReactPointerEvent<HTMLElement>, drag: BandDrag) => {
    if (ev.button !== 0) return;
    bandDragRef.current = drag;
    // Never inherit the last drag's edge: a page turning under a gesture that
    // has only just started aims it at days nobody pointed at.
    setEdgePage(0);
    // Captured on the row, never on the cell: the page turns mid-drag and the
    // cell you pressed is unmounted with it, taking the capture with it.
    bandRowRef.current?.setPointerCapture(ev.pointerId);
  };

  const onBandPointerMove = (ev: ReactPointerEvent<HTMLElement>) => {
    const drag = bandDragRef.current;
    if (!drag) return;
    // A few pixels of slop, so a press with an unsteady hand stays a press.
    if (!drag.moved && Math.abs(ev.clientX - drag.startX) < 4) return;
    drag.moved = true;

    const hit = columnAt(ev.clientX);
    const date = hit ? dateOfDay(hit.dayId) : null;
    if (date) {
      const [start, end] =
        date < drag.anchorDate ? [date, drag.anchorDate] : [drag.anchorDate, date];
      drag.span = {
        start,
        end,
        placeId: drag.placeId,
        placeName: drag.placeName,
        uncovered: uncoveredBy(drag, { start, end }),
      };
      setBandSpan(drag.span);
    }

    const box = scrollerRef.current?.getBoundingClientRect();
    if (!box) return;
    setEdgePage(
      ev.clientX > box.right - EDGE_PX ? 1 : ev.clientX < box.left + EDGE_PX ? -1 : 0,
    );
  };

  const onBandPointerUp = () => {
    const drag = bandDragRef.current;
    bandDragRef.current = null;
    const span = drag?.span ?? null;
    setBandSpan(null);
    setEdgePage(0);
    if (!drag) return;

    // A press that never moved is a click, and a click is about the one day
    // under it — the column is per day, so changing a neighbour nobody pointed
    // at would be the surprise this band exists to avoid.
    if (!drag.moved || !span) {
      openBandDialog({
        start: drag.pressedDate,
        end: drag.pressedDate,
        placeId: drag.placeId,
        placeName: drag.placeName,
      });
      return;
    }

    // Painting undecided days has no place to write yet, so the release asks
    // for one; nothing is written if the dialog is closed again.
    if (drag.mode === "paint" || drag.placeId === null) {
      openBandDialog(span);
      return;
    }

    commitBand(span, { placeId: drag.placeId }, span.uncovered ?? []);
    say(`${drag.placeName ?? "Overnight place"} now ${describeSpan(days, span)}.`);
  };

  const selectedEvent = selected === null ? null : events.find((e) => e.id === selected);

  // Gutter plus a floor per column — not `max-content`, which let one long
  // all-day pill's content vote on the column's width instead of truncating.
  const frameMinWidth = GUTTER_PX + shownDays.length * COLUMN_MIN_PX[effectiveView];

  const rowStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: `${GUTTER_PX}px repeat(${shownDays.length}, minmax(${COLUMN_MIN_PX[effectiveView]}px, 1fr))`,
    minWidth: frameMinWidth,
  };

  return (
    <div className="overflow-hidden rounded-lg bg-sheet">
      <div className="flex flex-wrap items-center gap-2 border-b border-rule bg-sheet-2 px-3 py-2.5">
        <Button
          onClick={() => setAnchor(todayIndex)}
          disabled={!hasToday}
          title={hasToday ? undefined : "The trip isn't running today"}
        >
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
        <p className="min-w-[11rem] text-sm font-semibold" aria-live="polite">
          {rangeLabel}
        </p>

        <div className="flex-1" />

        {/* The block-colour key doubles as the filter (ticket 90), behind one
            triple-dot rather than three always-on swatches. A count rides
            beside the trigger whenever anything is hidden. */}
        {hiddenCount > 0 ? (
          <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-ink-soft">
            {typeCount - hiddenCount} of {typeCount} shown
          </span>
        ) : null}
        <Menu
          label={
            hiddenCount > 0
              ? `Filter by type — ${typeCount - hiddenCount} of ${typeCount} shown`
              : "Filter by type"
          }
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

        <div className="inline-flex overflow-hidden rounded-full border border-rule-strong">
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
                "px-3 py-1 font-mono text-[11px] uppercase tracking-[0.06em] transition-colors disabled:opacity-50",
                effectiveView === option
                  ? "bg-pen text-sheet"
                  : "bg-sheet text-ink-soft hover:bg-sheet-2",
              )}
            >
              {option === "day" ? "Day" : "Week"}
            </button>
          ))}
        </div>

      </div>

      {/* The pane's 20rem only appears once an event is picked — the calendar
          is what the page is for otherwise. */}
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
          {/* ONE scroll container for both axes — load-bearing. `position:
              sticky` resolves against the nearest scrolling ancestor, so
              separate horizontal/vertical scrollers would leave the gutter
              pinned to a box that never moves sideways. */}
          <div
            ref={scrollerRef}
            className="max-h-[70vh] overflow-auto"
            style={{ scrollPaddingTop: headHeight }}
          >
            {/* One wrapper owns every calendar row so the head, band, all-day
                strip and grid share the same `1fr` space and stay aligned. */}
            <div className="w-full" style={{ minWidth: frameMinWidth }}>
            <div
              ref={headRef}
              className="sticky top-0 z-30 shadow-raised"
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
                    // Today is the whole head, filled — a pill around just the
                    // number moved that column's date to a different height.
                    day.isToday && "bg-pen text-sheet",
                    landing?.dayId === day.id && "bg-pen-soft",
                  )}
                >
                  <p className={cx("typed", day.isToday && "text-sheet/80")}>
                    {day.weekday}
                  </p>
                  <p className="nums text-lg font-semibold">
                    {day.dayOfMonth}
                    {/* Colour is never the only signal (CLAUDE.md) — the word
                        is here for anyone who can't see the fill. */}
                    {day.isToday ? <span className="sr-only"> — today</span> : null}
                  </p>
                  {effectiveView === "day" ? (
                    <div className="mt-1 flex justify-center">
                      {removeDayControls[day.id]}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            {/* The overnight band (ticket 141): press a day for the dialog,
                drag across days for the dialog on that span, drag a bar's end
                to grow/shrink the run on release. All three fall back to the
                dialog for keyboard/phone. */}
            <div
              ref={bandRowRef}
              style={rowStyle}
              // `select-none`: without it, dragging along the band selects text.
              className="select-none border-b border-rule bg-sheet"
              onPointerMove={onBandPointerMove}
              onPointerUp={onBandPointerUp}
              onPointerCancel={onBandPointerUp}
            >
              {/* Not `.typed`: at 11px it ran under the rule, wider than the
                  clock column it shares. Same mono face, sized for "00:00". */}
              <div className="sticky left-0 z-20 flex items-center justify-end border-r border-rule bg-sheet px-1.5 py-1.5">
                <span className="font-mono text-[9px] uppercase tracking-[0.02em] text-ink-faint">
                  Overnight
                </span>
              </div>

              {bandRuns.map((run) => {
                const first = run.days[0];
                const last = run.days[run.days.length - 1];
                const cell: CSSProperties = { gridColumn: `span ${run.days.length}` };

                // A padding day has no `day` row to write to, so its band cell
                // is scenery — the same silence the column below it keeps.
                if (first.outside) {
                  return (
                    <div
                      key={first.date}
                      aria-hidden
                      style={cell}
                      className={cx("h-9 border-l border-rule", OUTSIDE_DAY_CLASS)}
                    />
                  );
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
                  // Only a handle can shrink a run, so only a handle carries the
                  // run's true extent; a press in the middle paints outward from
                  // where it started and leaves the rest of the stay alone.
                  runStart: from.whole ? bounds.start : from.pressedDate,
                  runEnd: from.whole ? bounds.end : from.pressedDate,
                  startX: ev.clientX,
                  moved: false,
                  span: null,
                });

                if (run.placeId === null && !run.preview) {
                  return (
                    <div
                      key={first.date}
                      style={cell}
                      className="border-l border-rule p-1"
                    >
                      <button
                        type="button"
                        aria-label={`Overnight place for ${first.longLabel} — not set`}
                        onPointerDown={(ev) =>
                          startBandDrag(
                            ev,
                            dragFrom(ev, {
                              anchorDate: first.date,
                              pressedDate: first.date,
                              whole: false,
                            }),
                          )
                        }
                        onClick={(ev) => {
                          // Only the keyboard's click gets here: a pointer's
                          // goes to the row, which holds the capture.
                          if (ev.detail === 0) {
                            openBandDialog({
                              start: first.date,
                              end: first.date,
                              placeId: null,
                              placeName: null,
                            });
                          }
                        }}
                        // `block`, not default inline-block: the line's descender
                        // space made an empty day 7px taller than one with a bar.
                        className="block h-7 w-full rounded-full border border-dashed border-rule transition-colors hover:border-pen hover:bg-pen-soft"
                      />
                    </div>
                  );
                }

                return (
                  <div key={first.date} style={cell} className="relative border-l border-rule p-1">
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
                          dragFrom(ev, {
                            anchorDate: pressed ?? first.date,
                            pressedDate: pressed ?? first.date,
                            whole: false,
                          }),
                        );
                      }}
                      onClick={(ev) => {
                        // The keyboard has no day under it, so it addresses the
                        // run it has focus on — which is also what lets a
                        // keyboard do what the handles do.
                        if (ev.detail === 0) {
                          openBandDialog({
                            start: first.date,
                            end: last.date,
                            placeId: run.placeId,
                            placeName: run.placeName,
                          });
                        }
                      }}
                      className={cx(
                        "flex h-7 w-full items-center truncate rounded-full border px-2 text-xs transition-colors",
                        // Pen blue, not highlighter yellow — yellow is the food
                        // category's colour. `-edge` dissolves into the sheet (ticket 73).
                        run.preview
                          ? "justify-center border-dashed border-pen bg-pen-soft text-pen-deep"
                          : "border-pen-edge bg-pen-soft text-pen hover:border-pen",
                        run.openStart && "rounded-l-none",
                        run.openEnd && "rounded-r-none",
                      )}
                    >
                      {run.placeName}
                    </button>

                    {/* Both ends grabbable — a bar with one live end teaches
                        nothing about why. Hidden from keyboard users, who have
                        the dialog's last-day field instead. */}
                    {!run.preview && run.placeId !== null
                      ? (
                          [
                            // The anchor is the run's *true* far end, which may
                            // be on another page — a handle must not silently
                            // crop the half of the stay you can't see.
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
                          ))
                      : null}
                  </div>
                );
              })}
            </div>

            {/* Things that happen *on* a day rather than at a time keep their
                own strip above the clock, rather than inventing a time. */}
            <div style={rowStyle} className="border-b border-rule bg-sheet-2">
              {/* Not `.typed`: "All day" wrapped to two lines in a gutter sized
                  for "00:00" at that size. */}
              <div className="sticky left-0 z-20 flex items-center justify-end border-r border-rule bg-sheet-2 px-1.5 py-1.5">
                <span className="whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.02em] text-ink-faint">
                  All day
                </span>
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
            </div>

            {/* An hour's label centres *on* its line, so the row is inset by
                half a label — otherwise the first hour reads as hidden behind
                the all-day strip. On the row, not a column, so the clock stays
                aligned with the times regardless of per-column changes. */}
            <div style={rowStyle} ref={gridRef} className="mt-2.5 mb-2.5">
              <div
                className="sticky left-0 z-20 border-r border-rule bg-sheet"
                style={{ height: gridHeight }}
              >
                <div className="relative h-full">
                  {Array.from({ length: endHour - startHour + 1 }, (_, i) => (
                    <span
                      key={i}
                      // Not `.typed`: at 11px the clock was the smallest text
                      // on a page it's meant to be read off.
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
        className="m-auto w-full max-w-lg rounded-lg bg-sheet p-0 text-ink shadow-card backdrop:bg-black/30"
      >
        {adding ? (
          <>
            <div className="flex items-center justify-between border-b border-rule px-4 py-3">
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

      {banding ? (
        <OvernightDialog
          span={banding}
          days={tripDays}
          searchPlaces={searchPlaces}
          onClose={() => setBanding(null)}
          onSave={(end, place) => {
            const span = { ...banding, end };
            setBanding(null);
            commitBand(span, place, []);
            say(
              `${"name" in place ? place.name : (banding.placeName ?? "Overnight place")} now ` +
                `${describeSpan(days, span)}.`,
            );
          }}
          onClear={() => {
            setBanding(null);
            commitBand({ ...banding, placeId: null, placeName: null }, null, []);
            say(`No overnight place for ${describeSpan(days, banding)}.`);
          }}
        />
      ) : null}
    </div>
  );
}

/** Where the group sleeps, for a span of days (ticket 141) — the whole gesture
 * for anyone who can't drag; the last-day field does a fortnight in one keystroke. */
function OvernightDialog({
  span,
  days,
  searchPlaces,
  onClose,
  onSave,
  onClear,
}: {
  span: BandSpan;
  /** The trip's real days — the last of them is as far as a stay can reach. */
  days: CalendarDay[];
  searchPlaces: PlaceSearch;
  onClose: () => void;
  onSave: (end: string, place: OvernightPlace) => void;
  onClear: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [pick, setPick] = useState<PlacePickerResult | null>(null);
  const [end, setEnd] = useState(span.end);

  useEffect(() => {
    if (!ref.current?.open) ref.current?.showModal();
  }, []);

  const save = () => {
    // An untouched picker means the span keeps the place it already had — the
    // id, not the name, so the stay keeps its pin (see `resolveOvernightPlace`).
    const place: OvernightPlace | null = pick?.name.trim()
      ? {
          name: pick.name,
          providerId: pick.providerId,
          lat: pick.lat,
          lng: pick.lng,
          countryCode: pick.countryCode,
        }
      : span.placeId !== null
        ? { placeId: span.placeId }
        : null;
    if (!place) return;
    onSave(end < span.start ? span.start : end, place);
  };

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(ev) => {
        if (ev.target === ref.current) onClose();
      }}
      className="m-auto w-full max-w-md rounded-lg bg-sheet p-0 text-ink shadow-card backdrop:bg-black/30"
    >
      <div className="flex items-center justify-between border-b border-rule px-4 py-3">
        <h2 className="font-display text-base font-semibold">
          Overnight — {describeSpan(days, span)}
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

      <div className="space-y-3 p-4">
        {/* Only shown where there's something to clear. */}
        {span.placeId !== null ? (
          <div>
            <Button type="button" onClick={onClear}>
              No overnight place
            </Button>
          </div>
        ) : null}

        <PlacePicker
          name="overnight"
          label="Place"
          defaultName={span.placeName ?? ""}
          search={searchPlaces}
          onSelect={setPick}
        />

        <Field label="Last day">
          <Input
            type="date"
            value={end}
            min={span.start}
            max={days[days.length - 1]?.date}
            onChange={(ev) => setEnd(ev.target.value)}
          />
        </Field>

        <div className="flex justify-end">
          <Button type="button" variant="primary" onClick={save}>
            Save
          </Button>
        </div>
      </div>
    </dialog>
  );
}

/** "Monday 12 May", or both ends of a run. */
function describeSpan(days: CalendarDay[], span: { start: string; end: string }) {
  const label = (date: string) => days.find((d) => d.date === date)?.longLabel ?? date;
  return span.start === span.end
    ? label(span.start)
    : `${label(span.start)} – ${label(span.end)}`;
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

  // Packing decides *where* a block goes, not render order — rendering in
  // `packLanes`' start-sorted order re-sorted the keyed nodes on drag, and
  // Chrome drops pointer capture on a node taken out of the tree and put back.
  // Fixed order by id, with `top`/`left` doing the moving, avoids that.
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

      {/* The blob marks which end of the line to read from and stays findable
          where the line crosses an empty hour. Time named for screen readers
          — colour is never the only signal. */}
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

            {/* Resize handle: a span, not a button — a button inside a button
                isn't valid markup. Keyboard equivalent is ↑/↓ on the block.
                The grip pill isn't decoration; without it the strip is invisible. */}
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
