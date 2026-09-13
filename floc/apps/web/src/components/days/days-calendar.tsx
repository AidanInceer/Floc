"use client";

/**
 * Days as a calendar (ticket 103) — hours down, days across, events as blocks.
 * Owns geometry/gestures only; `days/page.tsx` owns the content (the event
 * modal's panel) as server-rendered nodes, since those are full of Server Actions.
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

import type { PlaceSearch } from "@/components/days/event-form";
import {
  AddEventDialog,
  AllDayStrip,
  CalendarGrid,
  CalendarToolbar,
  DayHeads,
  EventModal,
} from "@/components/days/days-calendar-chrome";
import { OvernightBandRow } from "@/components/days/days-overnight-band";
import { OvernightDialog } from "@/components/days/days-overnight-dialog";
import {
  COLUMN_MIN_PX,
  EDGE_PX,
  GUTTER_PX,
  HOUR_PX,
  describeSpan,
  type BandDrag,
  type CalendarDay,
  type CalendarEvent,
  type Landing,
  type OvernightPlace,
} from "@/components/days/days-calendar-shared";
import {
  LAST_START_MINUTE,
  clamp,
  formatSpan,
  gridWindow,
  snap,
  spanOf,
  toHhmm,
} from "@floc/core/dates/calendar";
import {
  draggedPast,
  eventKeyGesture,
  eventLanding,
  rangeFromAnchor,
  resolveBandRelease,
} from "@floc/core/dates/calendar-gestures";
import {
  bandRuns as runsOfBand,
  uncoveredBy,
  type BandSpan,
} from "@floc/core/itinerary/overnight-band";

export type { CalendarDay, CalendarEvent, OvernightPlace } from "@/components/days/days-calendar-shared";

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

export function DaysCalendar({
  days,
  events,
  panels,
  removeDayControls,
  submitEvent,
  rescheduleEvent,
  moveEventToDay,
  setOvernight,
  searchPlaces,
  openEventId,
  groupSize,
  bookingPrefill,
}: {
  days: CalendarDay[];
  events: CalendarEvent[];
  /** Server-rendered detail panel per event id. */
  panels: Record<number, ReactNode>;
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
  /** Opened on arrival, from a file's "on [event]" tag (ticket 323). */
  openEventId?: number | null;
  groupSize: number;
  bookingPrefill: boolean;
}) {
  const hasToday = days.some((d) => d.isToday);
  const todayIndex = Math.max(
    0,
    days.findIndex((d) => d.isToday),
  );

  const [view, setView] = useState<"day" | "week">("week");
  const [anchor, setAnchor] = useState(todayIndex);
  const [selected, setSelected] = useState<number | null>(null);
  const [adding, setAdding] = useState<{ dayId: number; time: string } | null>(null);
  const [announcement, setAnnouncement] = useState("");

  // Held locally until fresh server props confirm it, so the block doesn't
  // snap back to stale props while the action is in flight (rule 7).
  const [optimistic, setOptimistic] = useState<Map<number, Landing>>(new Map());
  const [landing, setLanding] = useState<Landing | null>(null);
  const [, startTransition] = useTransition();

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

  // Once per id, not once per render: after this the selection is the user's,
  // so re-running would reopen the modal every time they close it.
  const arrivedOn = useRef<number | null>(null);
  useEffect(() => {
    if (openEventId == null || arrivedOn.current === openEventId) return;
    arrivedOn.current = openEventId;
    const event = events.find((e) => e.id === openEventId);
    if (!event) return;
    const index = days.findIndex((d) => d.id === event.dayId);
    if (index >= 0) setAnchor(index);
    setSelected(openEventId);
  }, [openEventId, events, days]);

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
    return live;
  }, [events, optimistic, landing]);

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

  // Week stays offered at every width (mobile included): a narrow screen scrolls
  // the seven columns sideways rather than being dropped to Day for you.
  const effectiveView = view;

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
    if (!drag.moved && !draggedPast(ev.clientX - drag.startX, ev.clientY - drag.startY)) {
      return;
    }
    drag.moved = true;

    const span = spanOf(event);
    if (!span) return;
    const hit = columnAt(ev.clientX);
    if (!hit) return;

    const at = clamp(snap(yToMinutes(ev.clientY - hit.top)), 0, 24 * 60);
    const next: Landing = {
      eventId: event.id,
      dayId: drag.mode === "resize" ? event.dayId : hit.dayId,
      ...eventLanding(span, drag.mode, at, drag.grabOffset),
    };

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
    const gesture = eventKeyGesture(span, ev.key, ev.shiftKey);
    if (!gesture) return;
    ev.preventDefault();

    if (gesture.kind === "move") {
      commit({ eventId: event.id, dayId: event.dayId, time: gesture.time, endTime: gesture.endTime });
      say(`${event.title} now ${formatSpan({ ...gesture, allDay: false })}.`);
      return;
    }

    const from = days.findIndex((d) => d.id === event.dayId);
    const to = days[from + gesture.step];
    // Off the end of the trip, or onto a padding column: both are "there is no
    // day there", and both simply refuse.
    if (!to || to.outside) return;
    commit({ eventId: event.id, dayId: to.id, time: gesture.time, endTime: gesture.endTime });
    say(`${event.title} moved to ${to.longLabel}.`);
  };

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
    if (!drag.moved && !draggedPast(ev.clientX - drag.startX, 0)) return;
    drag.moved = true;

    const hit = columnAt(ev.clientX);
    const date = hit ? dateOfDay(hit.dayId) : null;
    if (date) {
      const { start, end } = rangeFromAnchor(drag.anchorDate, date);
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

    // What the release means — a click opens the dialog on its day, a paint asks
    // for a place, an extend of a placed run commits — lives in the gesture lib.
    const release = resolveBandRelease(drag, span);
    if (release.kind === "dialog") {
      openBandDialog(release.span);
      return;
    }
    commitBand(release.span, { placeId: release.placeId }, release.uncovered);
    say(`${drag.placeName ?? "Overnight place"} now ${describeSpan(days, release.span)}.`);
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
      <CalendarToolbar
        hasToday={hasToday}
        onToday={() => setAnchor(todayIndex)}
        goPrev={goPrev}
        goNext={goNext}
        canPrev={canPrev}
        canNext={canNext}
        rangeLabel={rangeLabel}
        effectiveView={effectiveView}
        setView={setView}
      />

      <div className="grid grid-cols-1">
        <div onClick={onCalendarClick} className="min-w-0">
          {/* ONE scroll container for both axes — load-bearing. `position:
              sticky` resolves against the nearest scrolling ancestor, so
              separate horizontal/vertical scrollers would leave the gutter
              pinned to a box that never moves sideways. */}
          <div ref={scrollerRef} className="max-h-[70vh] overflow-auto" style={{ scrollPaddingTop: headHeight }}>
            {/* One wrapper owns every calendar row so the head, band, all-day
                strip and grid share the same `1fr` space and stay aligned. */}
            <div className="w-full" style={{ minWidth: frameMinWidth }}>
            <div ref={headRef} className="sticky top-0 z-30 shadow-raised">
            <DayHeads
              shownDays={shownDays}
              landingDayId={landing?.dayId ?? null}
              effectiveView={effectiveView}
              removeDayControls={removeDayControls}
              rowStyle={rowStyle}
            />

            <OvernightBandRow
              bandRuns={bandRuns}
              days={days}
              rowStyle={rowStyle}
              rowRef={bandRowRef}
              onPointerMove={onBandPointerMove}
              onPointerUp={onBandPointerUp}
              startBandDrag={startBandDrag}
              openBandDialog={openBandDialog}
              columnAt={columnAt}
              dateOfDay={dateOfDay}
            />

            <AllDayStrip
              shownDays={shownDays}
              events={shown}
              rowStyle={rowStyle}
              selected={selected}
              onSelect={select}
              moveEventToDay={moveEventToDay}
              say={say}
            />
            </div>

            <CalendarGrid
              gridRef={gridRef}
              rowStyle={rowStyle}
              gridHeight={gridHeight}
              startHour={startHour}
              endHour={endHour}
              shownDays={shownDays}
              events={shown}
              selected={selected}
              landing={landing}
              nowMinutes={nowMinutes}
              minutesToY={minutesToY}
              yToMinutes={yToMinutes}
              onAdd={openAdd}
              onPointerDown={onBlockPointerDown}
              onPointerMove={onBlockPointerMove}
              onPointerUp={onBlockPointerUp}
              onKeyDown={onBlockKeyDown}
            />
            </div>
          </div>
        </div>

      </div>

      <EventModal
        open={selectedEvent != null}
        onClose={() => setSelected(null)}
        panel={selectedEvent ? panels[selectedEvent.id] : null}
      />

      {/* Every gesture says what it did: a drag that reports itself only
          visually reports itself to some of the group. */}
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <AddEventDialog
        adding={adding}
        days={days}
        submitEvent={submitEvent}
        searchPlaces={searchPlaces}
        onClose={() => setAdding(null)}
      />

      {banding ? (
        <OvernightDialog
          span={banding}
          days={tripDays}
          searchPlaces={searchPlaces}
          groupSize={groupSize}
          bookingPrefill={bookingPrefill}
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
