"use client";

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
import { EventDraftProvider, useEventDrafts } from "@/components/days/event-draft";
import {
  AddEventDialog,
  AllDayStrip,
  CalendarGrid,
  CalendarToolbar,
  EventModal,
} from "@/components/days/days-calendar-chrome";
import type { ColumnVariant } from "@/components/days/days-calendar-column";
import { FocusHeads, type FocusFacts } from "@/components/days/days-focus-heads";
import { OvernightDialog } from "@/components/days/days-overnight-dialog";
import { StopStrip } from "@/components/days/days-stop-strip";
import { dayStay } from "@/lib/days/day-stay";
import { useHeightFloor } from "@/components/days/use-height-floor";
import { useColumnTrade } from "@/components/days/use-column-trade";
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
import type { BandSpan } from "@floc/core/itinerary/overnight-band";
import type { StayWrite } from "@floc/core/itinerary/stay/overnight-pick";

export type { CalendarDay, CalendarEvent, OvernightPlace } from "@/components/days/days-calendar-shared";

type Drag = {
  eventId: number;
  mode: "move" | "resize";
  grabOffset: number;
  startX: number;
  startY: number;
  moved: boolean;
};

type Adding = { dayId: number; time: string; endTime?: string };

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

function focusFacts(days: CalendarDay[], index: number, events: CalendarEvent[], tripEnd: string | null): FocusFacts {
  const day = days[index];
  return {
    day,
    dayNumber: index + 1,
    tripLength: days.length,
    stay: day.overnightPlaceName
      ? { placeName: day.overnightPlaceName, ...dayStay(days, index, tripEnd) }
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
  tripEnd,
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
  moveEventToDay: (eventId: number, fromDayId: number, toDayId: number) => Promise<void>;
  setOvernight: (
    startDate: string,
    endDate: string,
    place: OvernightPlace | null,
  ) => Promise<void>;
  searchPlaces: PlaceSearch;
  openEventId?: number | null;
  initialDate?: string;
  groupSize: number;
  bookingPrefill: boolean;
  tripEnd: string | null;
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

  const [optimistic, setOptimistic] = useState<Map<number, Landing>>(new Map());
  const [landing, setLanding] = useState<Landing | null>(null);
  const drafts = useEventDrafts();
  const [, startTransition] = useTransition();

  const gridRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Drag | null>(null);

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
      drafts.apply(events).map((event) => {
        const pending = optimistic.get(event.id);
        return pending ? { ...event, dayId: pending.dayId, time: pending.time, endTime: pending.endTime } : event;
      }),
    [events, optimistic, drafts],
  );

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
  const trade = useColumnTrade(focusIndex, gridRef);
  const slotKey = trade.indices.join();
  const slots = useMemo(
    () => slotKey.split(",").map(Number).map((i) => days[i] ?? cap(i < 0 ? i : -10 - (i - days.length), addDays(days[focusIndex].date, i - focusIndex))),
    [days, focusIndex, slotKey],
  );

  const restIds = useMemo(() => new Set(days.slice(Math.max(0, focusIndex - 1), focusIndex + 2).map((d) => d.id)), [days, focusIndex]);
  const clock = useMemo(() => {
    const ids = restIds;
    const spans = committed.flatMap((e) => {
      const span = ids.has(e.dayId) ? spanOf(e) : null;
      return span ? [span] : [];
    });
    return foldedClock(spans, { hourPx: HOUR_PX, foldPx: FOLD_PX, unfold });
  }, [committed, restIds, unfold]);

  const minutesToY = useCallback((m: number) => yAt(clock, m), [clock]);
  const yToMinutes = useCallback((y: number) => minuteAt(clock, y), [clock]);

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

  const moving = trade.phase !== undefined;
  const step = useCallback(
    (by: -1 | 1) => { if (!moving) setAnchor((a) => clamp(a + by, 0, days.length - 1)); },
    [days.length, moving],
  );
  const goTo = (dayId: number) => {
    const index = days.findIndex((d) => d.id === dayId);
    if (index >= 0 && !moving) setAnchor(index);
  };

  const [banding, setBanding] = useState<BandSpan | null>(null);
  const saveOvernight = (writes: StayWrite[], place: OvernightPlace | null) => {
    startTransition(async () => {
      for (const w of writes) await setOvernight(w.start, w.end, w.clear ? null : place);
    });
  };
  const card = useHeightFloor<HTMLDivElement>();

  const keptSelection = useRef(false);

  const select = (id: number) => {
    keptSelection.current = true;
    setSelected(id);
    const query = new URLSearchParams(searchParams.toString());
    query.set("event", String(id));
    router.replace(`${pathname}?${query}`, { scroll: false });
  };

  const closeEvent = useCallback(() => {
    setSelected(null);
    const query = new URLSearchParams(searchParams.toString());
    query.delete("event");
    router.replace(query.size ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [searchParams, router, pathname]);

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
      time: toHhmm(clamp(snap(minutes, endMinutes === undefined ? 15 : 1), 0, LAST_START_MINUTE)),
      endTime: endMinutes === undefined ? undefined : toHhmm(endMinutes),
    });
  };

  const openBandDialog = (span: BandSpan) => {
    keptSelection.current = true;
    setBanding(span);
  };

  const onBlockPointerDown = (
    ev: ReactPointerEvent<HTMLElement>,
    event: CalendarEvent,
    mode: "move" | "resize",
  ) => {
    if (ev.button !== 0) return;
    const span = spanOf(event);
    if (!span) return;
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

    if (!drag.moved || !dropped) {
      select(event.id);
      return;
    }

    commit(dropped);
    keptSelection.current = true;
    const day = days.find((d) => d.id === dropped.dayId);
    say(
      `${event.title} moved to ${day?.longLabel ?? "another day"}, ` +
        `${formatSpan({ ...dropped, allDay: false })}.`,
    );
  };

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
  useEffect(() => {
    if (selected !== null && selectedEvent === undefined) closeEvent();
  }, [selected, selectedEvent, closeEvent]);
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
    <EventDraftProvider value={drafts.api}>
    <div style={{ minHeight: card.floor }}>
      <div ref={card.ref} data-days-trade={trade.phase} style={trade.style} className={cx("overflow-hidden rounded-md bg-sheet", FOCUS_COLUMNS)}>
        <StopStrip days={days} tripEnd={tripEnd} focusId={focus.id} onGoTo={goTo} onStop={openBandDialog} />

        <CalendarToolbar
          nav={{
            hasToday,
            onToday: () => { if (!moving) setAnchor(todayIndex); },
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
                focus={focusFacts(days, focusIndex, events, tripEnd)}
                rowStyle={rowStyle}
                onGoTo={goTo}
                onAdd={() => openAdd(focus.id, 9 * 60)}
                removeControl={removeDayControls[focus.id]}
              />

              <AllDayStrip
                slots={slots}
                focusId={focus.id}
                events={trade.phase ? shown.filter((e) => restIds.has(e.dayId)) : shown}
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
          event={selectedEvent ?? null}
          dateLabel={days.find((d) => d.id === selectedEvent?.dayId)?.shortLabel ?? ""}
          onClose={closeEvent}
          submitEvent={submitEvent}
          searchPlaces={searchPlaces}
          rest={panel && panel.eventId === selected ? panel.content : null}
        />

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
            days={days}
            searchPlaces={searchPlaces}
            groupSize={groupSize}
            bookingPrefill={bookingPrefill}
            onClose={() => setBanding(null)}
            onSave={(writes, place) => {
              const span = { ...banding, ...writes[0]! };
              setBanding(null);
              saveOvernight(writes, place);
              const who = "name" in place ? place.name : (span.placeName ?? "Overnight place");
              say(`${who} now ${describeSpan(days, span)}.`);
            }}
            onClear={() => {
              const span = banding;
              setBanding(null);
              saveOvernight([{ start: span.start, end: span.end, clear: true }], null);
              say(`No overnight place for ${describeSpan(days, span)}.`);
            }}
          />
        ) : null}
      </div>
    </div>
    </EventDraftProvider>
  );
}
