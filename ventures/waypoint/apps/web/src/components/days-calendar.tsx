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
 * 4. **The overnight band** (ticket 141). A row of its own between the dates and
 *    the clock, where the group says where it is sleeping. One cell is one day,
 *    because that is what the database stores — `day.overnight_place_id`, one
 *    column. A run of days sharing a place draws as one bar with the name
 *    written once, which is the *derived* stop (rule 3): nothing here merges
 *    anything, `deriveStops` groups the days that already agree.
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
import { PlacePicker, type PlacePickerResult } from "@/components/place-picker";
import { Button, Field, Input, cx } from "@/components/ui";
import type { DayEventType, TransportType } from "@/db/schema";
import { addDays as addDaysToDate } from "@/lib/dates";
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

/**
 * The clock column, wide enough for `00:00` in the mono face — and, since
 * ticket 141, for the band's own label beside it, which is the longest word any
 * row puts there.
 */
const GUTTER_PX = 66;

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
  /** What the band draws. Null is a real answer: nobody has decided yet. */
  overnightPlaceName: string | null;
  /**
   * The id behind that name. An extend sends it back rather than the name, so
   * a stay keeps the one `place` row it was geocoded into — see
   * `resolveOvernightPlace`.
   */
  overnightPlaceId: number | null;
  /** 0 = Monday. What makes the week view a calendar week and not seven days. */
  weekdayIndex: number;
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

/**
 * What the band writes: a place this trip already points at, a fresh pick from
 * the search, or nothing at all. Structural, not imported from the action — a
 * client component that imports a `"use server"` module pulls it into the
 * bundle graph for a type it only needs at compile time.
 */
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
  /** The end that stays put — the opposite handle, or where the paint began. */
  anchorDate: string;
  /** The day actually pressed, which is what a press-without-a-drag opens. */
  pressedDate: string;
  /** The run's place, carried through an extend so it needs no second pick. */
  placeId: number | null;
  placeName: string | null;
  /** The run as it was before the drag — what a shrink has to clear. */
  runStart: string;
  runEnd: string;
  startX: number;
  moved: boolean;
  /**
   * Where the drag has got to. On the ref rather than read back off state at
   * release: a quick drag can put its last move and its release in one task,
   * and the handler would then be holding the render before the move.
   */
  span: BandSpan | null;
};

/** A span of days the band is showing as one place: dragging, or just written. */
type BandSpan = {
  start: string;
  end: string;
  placeId: number | null;
  placeName: string | null;
  /**
   * The days this span has taken *off* a run — what a shrink uncovers. They
   * have to be part of the picture: a handle dragged in off Friday that leaves
   * Friday drawn as it was reads as a split into two stays, which is the
   * opposite of what the gesture is doing.
   */
  uncovered?: [string, string][];
};

/** How close to the calendar's edge a drag has to get before the page turns. */
const EDGE_PX = 44;

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
  setOvernight,
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
  /** Where the group sleeps, for every day from `startDate` to `endDate`. */
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
  /** The box that scrolls both ways — what a band drag measures its edges against. */
  const scrollerRef = useRef<HTMLDivElement>(null);
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

  /* ---- the overnight band ---------------------------------------------------- */

  /*
   * Three pieces of state, and they are different things.
   *
   * `bandSpan` is the drag itself — what the pointer is currently saying, drawn
   * dashed and written to nothing. `pendingBand` is a write that has gone but
   * whose props haven't come back yet, so the bar doesn't flicker back to the
   * old answer in between (the same trade `optimistic` makes for events; rule 7
   * still decides who wins). `banding` is the dialog: the span it opened on.
   */
  const bandRowRef = useRef<HTMLDivElement>(null);
  const bandDragRef = useRef<BandDrag | null>(null);
  const [bandSpan, setBandSpan] = useState<BandSpan | null>(null);
  const [pendingBand, setPendingBand] = useState<BandSpan | null>(null);
  const [banding, setBanding] = useState<BandSpan | null>(null);
  /** -1 or 1 while a drag is held at an edge; the page turns on a timer. */
  const [edgePage, setEdgePage] = useState<-1 | 0 | 1>(0);

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
  // Memoised because the band's runs are derived from it: a fresh `[]` every
  // render would rebuild them every render.
  const shownDays = useMemo(() => pages[pageIndex] ?? [], [pages, pageIndex]);

  const goTo = (page: CalendarDay[] | undefined) => {
    if (page?.[0]) setAnchor(days.findIndex((d) => d.id === page[0].id));
  };
  const goPrev = () => goTo(pages[pageIndex - 1]);
  const goNext = () => goTo(pages[pageIndex + 1]);

  /*
   * The arrows grey out at the ends of the trip; they do not leave.
   *
   * They used to leave, on the argument that a disabled control says "there is
   * more that way, just not for you". The cost of that is a toolbar that
   * reshuffles itself as you page — the control you are aiming at moves under
   * the cursor on the one click that reaches the end — and a first page where
   * the only arrow present points the way you cannot see you could also go.
   * A greyed arrow says "nothing that way" perfectly well, and says it in a
   * fixed place.
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

  /* ---- the overnight band's runs, gestures and writes ------------------------ */

  const tripDays = useMemo(() => days.filter((d) => !d.outside), [days]);
  const dateOfDay = useCallback(
    (dayId: number) => days.find((d) => d.id === dayId)?.date ?? null,
    [days],
  );

  /** The place a day shows *right now*, drag and pending write included. */
  const bandOverlay = bandSpan ?? pendingBand;
  const overlayIsDrag = bandSpan !== null;

  /*
   * The bars. A run of days sharing a place is one grid item spanning its
   * columns, so the name is written once and the bar is genuinely continuous —
   * seven cells each repeating "Barcelona" would draw one stop as seven.
   *
   * Undecided days are the opposite: each is its own cell, because each is its
   * own target. They never join, or a click meant for Tuesday would land on a
   * bar that owns half the week.
   */
  const bandRuns = useMemo(() => {
    const placeOf = (day: CalendarDay) => {
      if (
        bandOverlay &&
        !day.outside &&
        day.date >= bandOverlay.start &&
        day.date <= bandOverlay.end
      ) {
        return {
          id: bandOverlay.placeId,
          name: bandOverlay.placeName,
          preview: overlayIsDrag,
        };
      }
      // A day the drag has pulled off its run reads as undecided from the first
      // pixel, because that is what letting go would make it.
      if (
        bandOverlay?.uncovered?.some(
          ([from, to]) => !day.outside && day.date >= from && day.date <= to,
        )
      ) {
        return { id: null, name: null, preview: false };
      }
      return {
        id: day.overnightPlaceId,
        name: day.overnightPlaceName,
        preview: false,
      };
    };

    const runs: {
      placeId: number | null;
      placeName: string | null;
      preview: boolean;
      days: CalendarDay[];
    }[] = [];

    for (const day of shownDays) {
      const place = placeOf(day);
      // An undecided, un-previewed day is a cell of its own; everything else
      // continues the run beside it when it agrees with it.
      const joins = place.id !== null || place.preview;
      const last = runs[runs.length - 1];
      if (last && joins && last.placeId === place.id && last.preview === place.preview) {
        last.days.push(day);
        continue;
      }
      runs.push({
        placeId: place.id,
        placeName: place.name,
        preview: place.preview,
        days: [day],
      });
    }

    // A run that carries on past the page's edge is squared off there and grows
    // no handle: the day it would extend from isn't on screen to aim at.
    return runs.map((run) => {
      const before = days[days.indexOf(run.days[0]) - 1];
      const after = days[days.indexOf(run.days[run.days.length - 1]) + 1];
      const continuing = (neighbour: CalendarDay | undefined) =>
        run.placeId !== null &&
        !run.preview &&
        neighbour !== undefined &&
        neighbour.overnightPlaceId === run.placeId;
      return {
        ...run,
        openStart: continuing(before),
        openEnd: continuing(after),
      };
    });
  }, [shownDays, days, bandOverlay, overlayIsDrag]);

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

  /*
   * A drag held at the edge turns the page and keeps going, because a stay of
   * ten nights does not fit in a calendar week and "drag to Sunday, let go,
   * page, find the handle, drag again" is four gestures for one decision.
   */
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

  /*
   * How wide the calendar insists on being: the gutter plus a floor per column,
   * and nothing else.
   *
   * It used to be `max-content` — on the rows and on the frame around them —
   * which asks the *content* how wide the week should be. One all-day pill
   * reading "Train to the next stop" was therefore enough to push a week that
   * fits perfectly well into a horizontal scroll, on a screen with room to
   * spare. Nothing inside a column may vote on the column's width; the pills
   * and the bars all truncate, so a long name is a short label rather than a
   * wider calendar. The scrollbar is now what it always claimed to be: the
   * answer to a window too narrow for seven columns at their floor.
   */
  const frameMinWidth = GUTTER_PX + shownDays.length * COLUMN_MIN_PX[effectiveView];

  const rowStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: `${GUTTER_PX}px repeat(${shownDays.length}, minmax(${COLUMN_MIN_PX[effectiveView]}px, 1fr))`,
    minWidth: frameMinWidth,
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
        {/* A pair, always, and drawn as controls rather than as glyphs: the
            arrow is the thing you reach for most on this page, and in ghost
            weight at 11px it was the quietest mark in the toolbar. */}
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
            ref={scrollerRef}
            className="max-h-[70vh] overflow-auto"
            style={{ scrollPaddingTop: headHeight }}
          >
            {/* The shadow is what makes the pinned head read as a layer over
                the grid rather than as part of it — without it, hours sliding
                underneath look like a rendering fault. */}
            {/* One wrapper owns every calendar row. The head, the overnight
                band, the all-day strip and the timed grid must share the same
                `1fr` space; otherwise each row resolves that space on its own
                and the columns stop lining up. Its width is the frame's floor,
                not its content — see `frameMinWidth`. */}
            <div className="w-full" style={{ minWidth: frameMinWidth }}>
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
                    // Today is the whole head, filled. It used to be a pill
                    // drawn around the number, which made one column's date sit
                    // at a different height from its neighbours' — a marker
                    // that moves the thing it marks. The cell was already
                    // there, and colouring it costs no geometry at all.
                    day.isToday && "bg-pen text-sheet",
                    landing?.dayId === day.id && "bg-pen-soft",
                  )}
                >
                  <p className={cx("typed", day.isToday && "text-sheet/75")}>
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

            {/*
             * The overnight band (ticket 141) — where the group sleeps, on the
             * surface that decides it.
             *
             * It sits under the dates and over the clock because that is what
             * it is about: the day, not a time on it. The gestures are two, and
             * they never overlap with the grid's own drag — this row is not the
             * grid, so a press here always means a bed.
             *
             *   press a day       → the dialog, for that day
             *   drag across days  → the dialog once, for the span
             *   drag a bar's end  → the run grows or shrinks, written on release
             *
             * Every one of them has the dialog behind it, which is the keyboard
             * and phone path: a drag is impossible with either.
             */}
            <div
              ref={bandRowRef}
              style={rowStyle}
              className="border-b border-rule bg-sheet"
              onPointerMove={onBandPointerMove}
              onPointerUp={onBandPointerUp}
              onPointerCancel={onBandPointerUp}
            >
              {/* Not `.typed`: at 11px with 0.08em of tracking the word is
                  wider than the clock column it shares, and it ran under the
                  rule. Same mono face, two steps down, tracking eased — the
                  gutter is sized for `00:00`, not for nine letters. */}
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
                        className="h-7 w-full rounded-sm border border-dashed border-rule transition-colors hover:border-rule-strong hover:bg-sheet-2"
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
                        "flex h-7 w-full items-center truncate rounded-sm border px-2 text-xs transition-colors",
                        /* The pen's own wash, not the highlighter's. Yellow is
                           the food category's colour one row down, and a bed is
                           not a meal; blue is what this app uses for the thing
                           that has been decided. `-edge` for the border or the
                           bar dissolves into the sheet (ticket 73). */
                        run.preview
                          ? "justify-center border-dashed border-pen bg-pen-soft/60 text-pen"
                          : "border-pen-edge bg-pen-soft text-pen hover:border-pen",
                        run.openStart && "rounded-l-none",
                        run.openEnd && "rounded-r-none",
                      )}
                    >
                      {run.placeName}
                    </button>

                    {/* The ends are grabbable, both of them: a stay has two
                        edges, and a bar with one live end teaches nothing about
                        why. Hidden from the reader with a keyboard, who has the
                        dialog's own last-day field instead.

                        Drawn as the event block's grip pill, turned on its
                        side: a thin bar inside a wider hit strip, so the target
                        stays a target while the mark stays quiet. In the pen's
                        blue rather than the bar's own ink — a handle is a
                        control, and the yellow made it read as more stay. */}
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

/**
 * Where the group sleeps, for a span of days (ticket 141).
 *
 * The dialog is not the drag's fallback — it is the whole gesture for anyone
 * who cannot drag. `PlacePicker` is the same search Route and the event form
 * use (ticket 110), and the last-day field is what lets one keystroke do what a
 * drag across a fortnight does.
 */
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
      className="m-auto w-full max-w-md rounded-md border border-rule bg-sheet p-0 text-ink backdrop:bg-black/40"
    >
      <div className="flex items-center justify-between border-b border-dotted border-rule-strong px-4 py-3">
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
        {/* Top of the list, and only where there is something to clear: an
            undecided day is already the answer this would give. */}
        {span.placeId !== null ? (
          <div>
            {/* The toolbar's weight — Today, Add a day — rather than a ghost.
                A tinted bar with no edge to it read as a heading for the field
                below rather than as the thing you press. */}
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

/**
 * The days a drag has pulled off the run it started on — the shrink's other
 * half. A handle drag says two things at once: these days take the place, and
 * those ones lose it.
 */
function uncoveredBy(
  drag: BandDrag,
  span: { start: string; end: string },
): [string, string][] {
  const ranges: [string, string][] = [];
  if (drag.runStart < span.start) {
    ranges.push([drag.runStart, addDaysToDate(span.start, -1)]);
  }
  if (drag.runEnd > span.end) ranges.push([addDaysToDate(span.end, 1), drag.runEnd]);
  return ranges;
}

/** "Monday 12 May", or both ends of a run. */
function describeSpan(days: CalendarDay[], span: { start: string; end: string }) {
  const label = (date: string) => days.find((d) => d.date === date)?.longLabel ?? date;
  return span.start === span.end
    ? label(span.start)
    : `${label(span.start)} – ${label(span.end)}`;
}

/**
 * How far the run under `date` actually reaches — across the page's edges,
 * which is where the calendar's own view of it stops.
 */
function runBoundsAt(days: CalendarDay[], date: string, placeId: number | null) {
  const at = days.findIndex((d) => d.date === date);
  if (at < 0 || placeId === null) return { start: date, end: date };
  let start = at;
  let end = at;
  while (start > 0 && days[start - 1].overnightPlaceId === placeId) start--;
  while (end < days.length - 1 && days[end + 1].overnightPlaceId === placeId) end++;
  return { start: days[start].date, end: days[end].date };
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
