"use client";

/**
 * The overnight band's state (ticket 141, split from `days-calendar`): the
 * drag in progress, the write in flight, the dialog, and the turn of the day
 * while a drag is held at an edge. The rules for what a release means live in
 * `@floc/core/dates/calendar-gestures`.
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";

import {
  EDGE_PX,
  describeSpan,
  type BandDrag,
  type CalendarDay,
  type OvernightPlace,
} from "@/components/days/days-calendar-shared";
import { draggedPast, rangeFromAnchor, resolveBandRelease } from "@floc/core/dates/calendar-gestures";
import { bandRuns as runsOfBand, uncoveredBy, type BandSpan } from "@floc/core/itinerary/overnight-band";

export function useOvernightBand({
  days,
  slots,
  setOvernight,
  say,
  columnAt,
  scrollerRef,
  step,
}: {
  days: CalendarDay[];
  slots: CalendarDay[];
  setOvernight: (startDate: string, endDate: string, place: OvernightPlace | null) => Promise<void>;
  say: (message: string) => void;
  columnAt: (x: number) => { dayId: number; top: number } | null;
  scrollerRef: RefObject<HTMLDivElement | null>;
  /** Moves the focus a day; a held drag calls it on a timer. */
  step: (by: -1 | 1) => void;
}) {
  const [, startTransition] = useTransition();

  // Ticket 141: `bandSpan` is the drag in progress, drawn dashed and written to nothing.
  // `pendingBand` is a write that's gone but whose props haven't come back yet,
  // so the bar doesn't flicker to the old answer in between (rule 7).
  // `banding` is the dialog: the span it opened on.
  const rowRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<BandDrag | null>(null);
  const [bandSpan, setBandSpan] = useState<BandSpan | null>(null);
  const [pendingBand, setPendingBand] = useState<BandSpan | null>(null);
  const [banding, setBanding] = useState<BandSpan | null>(null);
  /** -1 or 1 while a drag is held at an edge; the day turns on a timer. */
  const [edge, setEdge] = useState<-1 | 0 | 1>(0);

  const dateOfDay = useCallback((dayId: number) => days.find((d) => d.id === dayId)?.date ?? null, [days]);

  const overlay = bandSpan ?? pendingBand;
  const overlayIsDrag = bandSpan !== null;
  const runs = useMemo(() => runsOfBand(slots, days, overlay, overlayIsDrag), [slots, days, overlay, overlayIsDrag]);

  /* A write is confirmed when the props say what the overlay was claiming. */
  useEffect(() => {
    setPendingBand((pending) => {
      if (!pending) return pending;
      const covered = days.filter((d) => d.date >= pending.start && d.date <= pending.end);
      const emptied = days.filter((d) => pending.uncovered?.some(([from, to]) => d.date >= from && d.date <= to));
      const landed =
        covered.length > 0 &&
        covered.every((d) => d.overnightPlaceId === pending.placeId) &&
        emptied.every((d) => d.overnightPlaceId === null);
      return landed ? null : pending;
    });
  }, [days]);

  // A drag held at the edge turns the day and keeps going — a stay of ten
  // nights doesn't fit in three columns.
  useEffect(() => {
    if (edge === 0) return;
    const timer = setInterval(() => {
      // A release the row never saw (the pointer left the window, the tab lost
      // it) must not leave the calendar turning by itself.
      if (!dragRef.current) return setEdge(0);
      step(edge);
    }, 550);
    return () => clearInterval(timer);
  }, [edge, step]);

  const commit = useCallback(
    (span: BandSpan, place: OvernightPlace | null, cleared: [string, string][]) => {
      /*
       * Why: the overlay can only stand in for an answer whose id is already known —
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

  const startDrag = (ev: ReactPointerEvent<HTMLElement>, drag: BandDrag) => {
    if (ev.button !== 0) return;
    dragRef.current = drag;
    // Never inherit the last drag's edge: a turn under a gesture that has only
    // just started aims it at days nobody pointed at.
    setEdge(0);
    // Captured on the row, never on the cell: the day turns mid-drag and the
    // cell you pressed is unmounted with it, taking the capture with it.
    rowRef.current?.setPointerCapture(ev.pointerId);
  };

  const onPointerMove = (ev: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    // A few pixels of slop, so a press with an unsteady hand stays a press.
    if (!drag.moved && !draggedPast(ev.clientX - drag.startX, 0)) return;
    drag.moved = true;

    const hit = columnAt(ev.clientX);
    const date = hit ? dateOfDay(hit.dayId) : null;
    if (date) {
      const { start, end } = rangeFromAnchor(drag.anchorDate, date);
      drag.span = { start, end, placeId: drag.placeId, placeName: drag.placeName, uncovered: uncoveredBy(drag, { start, end }) };
      setBandSpan(drag.span);
    }

    const box = scrollerRef.current?.getBoundingClientRect();
    if (!box) return;
    setEdge(ev.clientX > box.right - EDGE_PX ? 1 : ev.clientX < box.left + EDGE_PX ? -1 : 0);
  };

  const onPointerUp = () => {
    const drag = dragRef.current;
    dragRef.current = null;
    const span = drag?.span ?? null;
    setBandSpan(null);
    setEdge(0);
    if (!drag) return;

    const release = resolveBandRelease(drag, span);
    if (release.kind === "dialog") {
      setBanding(release.span);
      return;
    }
    commit(release.span, { placeId: release.placeId }, release.uncovered);
    say(`${drag.placeName ?? "Overnight place"} now ${describeSpan(days, release.span)}.`);
  };

  return {
    runs,
    rowRef,
    banding,
    setBanding,
    commit,
    startDrag,
    onPointerMove,
    onPointerUp,
    dateOfDay,
  };
}
