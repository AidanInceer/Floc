"use client";

/**
 * Days as a focus day (ticket 103, redrawn as B5): the trip's days grouped by
 * stop on top, then one day drawn wide with the day before and after beside
 * it, and empty hours folded. Owns geometry/gestures only; `days/page.tsx`
 * owns the content (the event modal's panel) as server-rendered nodes.
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
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { PlaceSearch } from "@/components/days/event-form";
import { cx } from "@/components/system/ui";
import {
  AddEventDialog,
  AllDayStrip,
  CalendarGrid,
  CalendarToolbar,
  EventModal,
} from "@/components/days/days-calendar-chrome";
import type { ColumnVariant } from "@/components/days/days-calendar-column";
import { FocusHeads, type FocusFacts } from "@/components/days/days-focus-heads";
import { OvernightBandRow } from "@/components/days/days-overnight-band";
import { OvernightDialog } from "@/components/days/days-overnight-dialog";
import { StopStrip } from "@/components/days/days-stop-strip";
import { useOvernightBand } from "@/components/days/use-overnight-band";
import {
  FOCUS_COLUMNS,
  FOCUS_TEMPLATE,
  FOLD_PX,
  HOUR_PX,
  describeSpan,
  type CalendarDay,
  type CalendarEvent,
  type Landing,
  type OvernightPlace,
} from "@/components/days/days-calendar-shared";
import { LAST_START_MINUTE, clamp, formatSpan, snap, spanOf, toHhmm } from "@floc/core/dates/calendar";
import { draggedPast, eventKeyGesture, eventLanding } from "@floc/core/dates/calendar-gestures";
import { foldedClock, minuteAt, yAt } from "@floc/core/dates/clock-fold";
import { addDays } from "@floc/core/dates/dates";
import { runBoundsAt } from "@floc/core/itinerary/overnight-band";

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

type Adding = { dayId: number; time: string; endTime?: string };

/** A slot past either end of the trip. Negative ids mean nothing beyond "not a row". */
const cap = (id: number, date: string): CalendarDay => ({
  id,
  date,
  weekday: "",
  dayOfMonth: "",
  longLabel: "",
  shortLabel: "",
  overnightPlaceName: null,
  overnightPlaceId: null,
  outside: true,
  isToday: false,
});

function focusFacts(days: CalendarDay[], index: number, events: CalendarEvent[]): FocusFacts {
  const day = days[index];
  const run = runBoundsAt(days, day.date, day.overnightPlaceId);
  const runDays = days.filter((d) => d.date >= run.start && d.date <= run.end);
  return {
    day,
    dayNumber: index + 1,
    tripLength: days.length,
    stay: day.overnightPlaceName
      ? { placeName: day.overnightPlaceName, night: runDays.indexOf(day) + 1, nights: runDays.length }
      : null,
    eventCount: events.filter((e) => e.dayId === day.id).length,
  };
}

export function DaysCalendar({
  days,
  events,
  panel,
  removeDayControls,
  submitEvent,
  rescheduleEvent,
  moveEventToDay,
  setOvernight,
  searchPlaces,
  openEventId,
  initialDate,
  groupSize,
  bookingPrefill,
}: {
  days: CalendarDay[];
  events: CalendarEvent[];
  panel: { eventId: number; content: ReactNode } | null;
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
  /** Day to show first when arriving from an Overview day card. */
  initialDate?: string;
  groupSize: number;
  bookingPrefill: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasToday = days.some((d) => d.isToday);
  const todayIndex = Math.max(
    0,
    days.findIndex((d) => d.isToday),
  );

  const initialIndex = days.findIndex((d) => d.date === initialDate);
  const [anchor, setAnchor] = useState(
    initialIndex >= 0 ? initialIndex : todayIndex,
  );
  const [unfold, setUnfold] = useState(false);
  const [selected, setSelected] = useState<number | null>(openEventId ?? null);
  const [adding, setAdding] = useState<Adding | null>(null);
  const [announcement, setAnnouncement] = useState("");

  // Held locally until fresh server props confirm it, so the block doesn't
  // snap back to stale props while the action is in flight (rule 7).
  const [optimistic, setOptimistic] = useState<Map<number, Landing>>(new Map());
  const [landing, setLanding] = useState<Landing | null>(null);
  const [, startTransition] = useTransition();

  const gridRef = useRef<HTMLDivElement>(null);
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
    if (openEventId == null) {
      arrivedOn.current = null;
      setSelected(null);
      return;
    }
    if (arrivedOn.current === openEventId) return;
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

  const committed = useMemo(
    () =>
      events.map((event) => {
        const pending = optimistic.get(event.id);
        return pending ? { ...event, dayId: pending.dayId, time: pending.time, endTime: pending.endTime } : event;
      }),
    [events, optimistic],
  );

  // A same-column drag previews live on the block itself. Cross-column isn't:
  // re-parenting would unmount the node and drop the pointer capture the drag
  // depends on. Shows a drop line in the target column instead.
  const shown = useMemo(
    () =>
      committed.map((event) =>
        landing?.eventId === event.id && landing.dayId === event.dayId
          ? { ...event, time: landing.time, endTime: landing.endTime }
          : event,
      ),
    [committed, landing],
  );

  const focusIndex = clamp(anchor, 0, days.length - 1);
  const focus = days[focusIndex];
  const slots = useMemo(
    () => [
      days[focusIndex - 1] ?? cap(-1, addDays(days[focusIndex].date, -1)),
      days[focusIndex],
      days[focusIndex + 1] ?? cap(-2, addDays(days[focusIndex].date, 1)),
    ],
    [days, focusIndex],
  );

  // Laid out from what is written, not the drag in progress: a fold opening
  // under the pointer would move the very hour it is aiming at.
  const clock = useMemo(() => {
    const ids = new Set(slots.filter((d) => !d.outside).map((d) => d.id));
    const spans = committed.flatMap((e) => {
      const span = ids.has(e.dayId) ? spanOf(e) : null;
      return span ? [span] : [];
    });
    return foldedClock(spans, { hourPx: HOUR_PX, foldPx: FOLD_PX, unfold });
  }, [committed, slots, unfold]);

  const minutesToY = useCallback((m: number) => yAt(clock, m), [clock]);
  const yToMinutes = useCallback((y: number) => minuteAt(clock, y), [clock]);

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
  const columnAt = useCallback((x: number) => {
    const columns = gridRef.current?.querySelectorAll<HTMLElement>("[data-day-column]");
    if (!columns) return null;
    for (const column of columns) {
      const rect = column.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right) {
        return { dayId: Number(column.dataset.dayColumn), top: rect.top };
      }
    }
    return null;
  }, []);

  const step = useCallback(
    (by: -1 | 1) => setAnchor((a) => clamp(a + by, 0, days.length - 1)),
    [days.length],
  );
  const goTo = (dayId: number) => {
    const index = days.findIndex((d) => d.id === dayId);
    if (index >= 0) setAnchor(index);
  };

  const band = useOvernightBand({ days, slots, setOvernight, say, columnAt, scrollerRef, step });

  // The pane is the selection, not a switch of its own (ticket 138).
  // `keptSelection` is how the click that made the selection survives the
  // deselect handler it bubbles into.
  const keptSelection = useRef(false);

  const select = (id: number) => {
    keptSelection.current = true;
    setSelected(id);
    const query = new URLSearchParams(searchParams.toString());
    query.set("event", String(id));
    router.replace(`${pathname}?${query}`, { scroll: false });
  };

  const closeEvent = () => {
    setSelected(null);
    const query = new URLSearchParams(searchParams.toString());
    query.delete("event");
    router.replace(query.size ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const onCalendarClick = () => {
    if (keptSelection.current) {
      keptSelection.current = false;
      return;
    }
    if (selected !== null) closeEvent();
  };

  const openAdd = (dayId: number, minutes: number, endMinutes?: number) => {
    setAdding({
      dayId,
      time: toHhmm(clamp(snap(minutes), 0, LAST_START_MINUTE)),
      endTime: endMinutes === undefined ? undefined : toHhmm(endMinutes),
    });
  };

  const openBandDialog = (span: Parameters<typeof band.setBanding>[0]) => {
    keptSelection.current = true;
    band.setBanding(span);
  };

  const onBlockPointerDown = (
    ev: ReactPointerEvent<HTMLElement>,
    event: CalendarEvent,
    mode: "move" | "resize",
  ) => {
    if (ev.button !== 0) return;
    const span = spanOf(event);
    if (!span) return;
    // Measured against the column, not the block: with hours folded, a
    // height inside the block no longer maps to minutes on its own.
    const column = columnAt(ev.clientX);
    dragRef.current = {
      eventId: event.id,
      mode,
      grabOffset: column ? snap(yToMinutes(ev.clientY - column.top)) - span.start : 0,
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
    // Off the end of the trip: there is no day there, so it simply refuses.
    if (!to) return;
    commit({ eventId: event.id, dayId: to.id, time: gesture.time, endTime: gesture.endTime });
    say(`${event.title} moved to ${to.longLabel}.`);
  };

  const moveAllDay = (event: CalendarEvent, to: CalendarDay) => {
    startTransition(async () => {
      await moveEventToDay(event.id, event.dayId, to.id);
    });
    say(`${event.title} moved to ${to.longLabel}.`);
  };

  const selectedEvent = selected === null ? null : events.find((e) => e.id === selected);
  const rowStyle: CSSProperties = { display: "grid", gridTemplateColumns: FOCUS_TEMPLATE };
  const gestures = {
    onPointerDown: onBlockPointerDown,
    onPointerMove: onBlockPointerMove,
    onPointerUp: onBlockPointerUp,
    onKeyDown: onBlockKeyDown,
  };
  const column = (day: CalendarDay, variant: ColumnVariant) => ({
    day,
    variant,
    clock,
    events: shown.filter((e) => e.dayId === day.id && spanOf(e)),
    selected,
    landing,
    nowMinutes: day.isToday ? nowMinutes : null,
    minutesToY,
    yToMinutes,
    onAdd: openAdd,
    gestures,
  });

  return (
    <div className={cx("overflow-hidden rounded-lg bg-sheet", FOCUS_COLUMNS)}>
      <StopStrip days={days} focusId={focus.id} onGoTo={goTo} onStop={openBandDialog} />

      <CalendarToolbar
        nav={{
          hasToday,
          onToday: () => setAnchor(todayIndex),
          goPrev: () => step(-1),
          goNext: () => step(1),
          canPrev: focusIndex > 0,
          canNext: focusIndex < days.length - 1,
        }}
        rangeLabel={focus.longLabel}
        unfold={unfold}
        onToggleFold={() => setUnfold((v) => !v)}
        onAdd={() => openAdd(focus.id, 9 * 60)}
      />

      <div role="presentation" onClick={onCalendarClick} className="min-w-0">
        <div ref={scrollerRef} className="max-h-[70vh] overflow-y-auto" style={{ scrollPaddingTop: headHeight }}>
          <div ref={headRef} className="sticky top-0 z-30 shadow-raised">
            <FocusHeads
              slots={slots}
              focus={focusFacts(days, focusIndex, events)}
              rowStyle={rowStyle}
              onGoTo={goTo}
              onAdd={() => openAdd(focus.id, 9 * 60)}
              removeControl={removeDayControls[focus.id]}
            />

            <OvernightBandRow
              bandRuns={band.runs}
              days={days}
              rowStyle={rowStyle}
              rowRef={band.rowRef}
              onPointerMove={band.onPointerMove}
              onPointerUp={band.onPointerUp}
              startBandDrag={band.startDrag}
              openBandDialog={openBandDialog}
              columnAt={columnAt}
              dateOfDay={band.dateOfDay}
            />

            <AllDayStrip
              slots={slots}
              focusId={focus.id}
              events={shown}
              rowStyle={rowStyle}
              selected={selected}
              onSelect={select}
              onMove={moveAllDay}
            />
          </div>

          <CalendarGrid
            gridRef={gridRef}
            rowStyle={rowStyle}
            clock={clock}
            slots={slots}
            focusId={focus.id}
            column={column}
            onToggleFold={() => setUnfold((v) => !v)}
          />
        </div>
      </div>

      <EventModal
        open={selectedEvent != null}
        onClose={closeEvent}
        panel={panel?.eventId === selected ? panel.content : <p role="status" className="p-4 text-sm text-ink-soft">Loading event…</p>}
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

      {band.banding ? (
        <OvernightDialog
          span={band.banding}
          days={days}
          searchPlaces={searchPlaces}
          groupSize={groupSize}
          bookingPrefill={bookingPrefill}
          onClose={() => band.setBanding(null)}
          onSave={(end, place) => {
            const span = { ...band.banding!, end };
            band.setBanding(null);
            band.commit(span, place, []);
            say(
              `${"name" in place ? place.name : (span.placeName ?? "Overnight place")} now ` +
                `${describeSpan(days, span)}.`,
            );
          }}
          onClear={() => {
            const span = band.banding!;
            band.setBanding(null);
            band.commit({ ...span, placeId: null, placeName: null }, null, []);
            say(`No overnight place for ${describeSpan(days, span)}.`);
          }}
        />
      ) : null}
    </div>
  );
}
