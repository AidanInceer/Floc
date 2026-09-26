"use client";

/**
 * The Dates tab's calendar — four views over one grid:
 *
 * - **Mine** — paint your own free days (click or drag). Nothing writes until
 *   save: one action per session, not one round trip per day.
 * - **Everyone** — read-only, shaded by agreement (ticket 67): green all-free,
 *   red leaves someone out, unshaded nobody answered. Shaded *and* numbered.
 * - **The dates** — commit the trip's window: press-drag the ends, or click the
 *   two in turn; a half-made range previews before you make it (ticket 135).
 * - **Weather** — see below (ticket 148).
 */
import { Fragment, useRef, useState, useTransition, type ReactNode } from "react";

import { DayCell, type View } from "@/components/availability/availability-day-cell";
import { HourlyCurve, WeatherReadout } from "@/components/availability/availability-weather";
import { Button, LegendKey } from "@/components/system/ui";
import { PillToggle } from "@/components/system/client-ui";
import { ProStar } from "@/components/system/pro-star";
import {
  WEEKDAY_LABELS,
  addMonths,
  formatMonth,
  monthGrid,
  monthsFrom,
  type IsoMonth,
} from "@floc/core/dates/availability";
import {
  advanceRangePick,
  paintRange,
  pickedRange,
} from "@floc/core/dates/calendar-gestures";
import { dateRange, today, type IsoDate } from "@floc/core/dates/dates";
import {
  windowCost,
  windowCostLabel,
  type DayLoad,
} from "@floc/core/trip/trip-window";
import type { DailyForecast, TripForecast } from "@/server/itinerary/weather";

type ViewOption = { value: View; label: ReactNode };

const VIEWS: ViewOption[] = [
  { value: "mine", label: "Mine" },
  { value: "everyone", label: "Everyone" },
  { value: "dates", label: "The dates" },
];

// A free trip still sees the mode (ticket 248); the star says it is Pro.
function weatherOption(locked: boolean): ViewOption {
  if (!locked) return { value: "weather", label: "Weather" };
  return {
    value: "weather",
    label: (
      <span className="inline-flex items-center gap-1.5">
        Weather
        <ProStar />
        <span className="sr-only">, a Floc Pro feature</span>
      </span>
    ),
  };
}

export function AvailabilityCalendar({
  firstMonth,
  monthCount,
  mine,
  tallies,
  memberCount,
  tripStart,
  tripEnd,
  dayLoads,
  weather,
  weatherLocked = false,
  save,
  saveDates,
}: {
  firstMonth: IsoMonth;
  monthCount: number;
  mine: string[]; // viewer's own free dates, as stored
  tallies: Record<string, number>; // date → members free (incl. viewer)
  memberCount: number;
  tripStart: string | null;
  tripEnd: string | null;
  dayLoads: DayLoad[]; // every live day + its event count — what a shrink costs
  weather: TripForecast | null; // null → Weather mode not offered (ticket 148)
  /** Free trip: the mode is still offered, and says so instead (ticket 248). */
  weatherLocked?: boolean;
  save: (add: string[], remove: string[]) => Promise<void>;
  saveDates: (start: string | null, end: string | null) => Promise<{ error?: string }>;
}) {
  const [view, setView] = useState<View>("mine");
  const [month, setMonth] = useState(firstMonth);
  const [pending, startTransition] = useTransition();
  const surface = useRef<HTMLDivElement>(null);

  const hasWeather = weather !== null || weatherLocked;
  // Only the trip's own days carry weather (ticket 148): keep the days inside
  // `[tripStart, tripEnd]` so the reading follows the window if the dates move.
  const byDate: Record<IsoDate, DailyForecast> = {};
  if (weather && tripStart && tripEnd)
    for (const d of weather.days)
      if (d.date >= tripStart && d.date <= tripEnd) byDate[d.date] = d;
  // One open hourly drawer at a time — two push the month around.
  const [expandedDate, setExpandedDate] = useState<IsoDate | null>(null);

  const changeView = (v: View) => {
    setView(v);
    if (v !== "weather") setExpandedDate(null);
  };
  const toggleExpand = (date: IsoDate) =>
    setExpandedDate((cur) => (cur === date ? null : date));

  // Local edits while painting: only touched dates appear, so untouched days
  // fall through to the server's copy and a concurrent edit isn't reverted.
  const [edits, setEdits] = useState<Record<string, boolean>>({});
  // The drag recomputes the whole span from `base` each move, not cell-by-cell:
  // a fast drag skips `pointerenter` on cells and would leave holes.
  const [drag, setDrag] = useState<{
    anchor: string;
    target: boolean;
    base: Record<string, boolean>;
  } | null>(null);

  // The window being picked (starts from stored). Null start = nothing picked;
  // start with no end = half-made, can't be committed as a pair by accident.
  const [range, setRange] = useState<{ start: string | null; end: string | null }>(
    { start: tripStart, end: tripEnd },
  );
  const rangeEnd = range.end ?? range.start;
  const rangeChanged = range.start !== tripStart || rangeEnd !== tripEnd;

  // Window picking is a drag too, not just two clicks (ticket 135): holds the
  // press day, range recomputed from it each move so dragging back shrinks.
  const [rangeDrag, setRangeDrag] = useState<string | null>(null);
  // Day under the pointer while a start is picked but no end — draws the span
  // you're about to make (else a half-made range looks like a one-day trip).
  const [hover, setHover] = useState<string | null>(null);

  const halfMade = range.start !== null && range.end === null;
  const previewTo =
    halfMade && !rangeDrag && hover && hover > range.start! ? hover : null;

  const pickRange = (date: string) => setRange((r) => advanceRangePick(r, date));

  // A press picks what a click would (so a still release reads as click one/two)
  // and arms a drag — but only when starting a fresh window, else it would fight
  // the click completing a pair.
  const startRangePick = (date: string, e: React.PointerEvent) => {
    e.preventDefault(); // else the gesture is a text selection (see startPaint)
    try {
      surface.current?.setPointerCapture(e.pointerId);
    } catch {
      // Pointer gone — harmless, the pick still stands.
    }
    if (!halfMade) setRangeDrag(date);
    setHover(null);
    pickRange(date);
  };

  const extendRange = (date: string) => {
    if (!rangeDrag) return;
    setRange(pickedRange(rangeDrag, date));
  };

  const stored = new Set(mine);
  const isFree = (date: string) => edits[date] ?? stored.has(date);
  const changed = Object.entries(edits).filter(
    ([date, free]) => free !== stored.has(date),
  );
  const add = changed.filter(([, free]) => free).map(([date]) => date);
  const remove = changed.filter(([, free]) => !free).map(([date]) => date);

  // Capture is on the surface, not the cells (ticket 127): a touch pointer is
  // implicitly captured by the cell that took `pointerdown`, so on a phone no
  // other cell heard `pointerenter` and a drag painted one day. Capturing the
  // surface keeps moves and the release arriving wherever the finger ends up.
  const startPaint = (date: string, e: React.PointerEvent) => {
    e.preventDefault(); // else read as text selection, or a scroll on touch
    try {
      surface.current?.setPointerCapture(e.pointerId);
    } catch {
      // Pointer gone — the drag is about to cancel; don't take the paint with it.
    }
    const target = !isFree(date);
    setDrag({ anchor: date, target, base: edits });
    setEdits({ ...edits, [date]: target });
  };

  // Hit-test for the cell under the pointer — `pointerenter` can't say (see startPaint).
  const dateUnder = (e: React.PointerEvent): string | null => {
    const el = document
      .elementFromPoint(e.clientX, e.clientY)
      ?.closest<HTMLElement>("[data-date]");
    return el?.dataset.date ?? null;
  };

  const extendPaint = (date: string) => {
    if (!drag) return;
    setEdits(paintRange(drag.base, drag.anchor, date, drag.target, dateRange));
  };

  const onSave = () =>
    startTransition(async () => {
      await save(add, remove);
      setEdits({});
    });

  const [datesProblem, setDatesProblem] = useState<string | null>(null);
  const onSaveDates = () =>
    startTransition(async () => {
      const result = await saveDates(range.start, rangeEnd);
      setDatesProblem(result.error ?? null);
      setArmedKey(null);
    });

  // Cost of committing this window + its two-click gate (ticket 140). Priced
  // client-side (`windowCost` is pure over the once-sent `dayLoads`) so it's
  // ready as the range moves. `armedKey` is the window the user was shown the
  // price of; any further drag changes the key and re-arms, so a stale
  // "remove 6 days" can't be clicked through onto a smaller window.
  const cost = windowCost(dayLoads, range.start, rangeEnd);
  const costLabel = windowCostLabel(cost);
  const rangeKey = `${range.start}|${rangeEnd}`;
  const [armedKey, setArmedKey] = useState<string | null>(null);
  const armed = !!costLabel && armedKey === rangeKey;

  // A first or only-growing window has no cost, so it commits on one click.
  const onCommit = () => {
    if (costLabel && !armed) setArmedKey(rangeKey);
    else onSaveDates();
  };

  const months = monthsFrom(month, monthCount);
  const now = today();

  // One fixed footer shape for every view, else switching views moved the card's
  // bottom edge. Reserves two rows (ticket 133): the dates view's range + buttons
  // + key wrap to a second line below a wide desktop.
  const footer =
    "mt-3 flex min-h-[calc(2rem+0.5rem+2rem+1rem+1px)] flex-wrap content-start items-center gap-x-4 gap-y-2 border-t border-rule pt-3";

  return (
    <div
      ref={surface}
      // Drag handlers live here, not on cells (see startPaint).
      onPointerMove={(e) => {
        const date = dateUnder(e);
        if (drag) {
          if (date) extendPaint(date);
        } else if (rangeDrag) {
          if (date) extendRange(date);
        } else if (view === "dates") {
          setHover(date); // trailing edge of the span the next click would make
        } else if (view === "weather") {
          // The day the reading line reports; only the trip's own days answer.
          const inWindow =
            !!date &&
            !!tripStart &&
            !!tripEnd &&
            date >= tripStart &&
            date <= tripEnd;
          setHover(inWindow ? date : null);
        }
      }}
      onPointerLeave={() => setHover(null)}
      onPointerUp={() => {
        setDrag(null);
        setRangeDrag(null);
      }}
      onPointerCancel={() => {
        setDrag(null);
        setRangeDrag(null);
      }}
    >
      <PillToggle
        label="Calendar view"
        value={view}
        options={hasWeather ? [...VIEWS, weatherOption(weatherLocked)] : VIEWS}
        onChange={changeView}
        className="mb-4"
      />

      <div className="rounded-md border border-rule bg-sheet p-3 shadow-card">
        <div className="mb-2 flex items-center gap-2">
          <Button
            variant="secondary"
            className="!px-2.5"
            aria-label="Earlier months"
            onClick={() => setMonth(addMonths(month, -1))}
          >
            <MonthArrow direction="back" />
          </Button>
          <p className="flex-1 text-center font-display font-semibold">{formatMonth(month)}</p>
          <Button
            variant="secondary"
            className="!px-2.5"
            aria-label="Later months"
            onClick={() => setMonth(addMonths(month, 1))}
          >
            <MonthArrow direction="forward" />
          </Button>
        </div>

        {months.map((m, i) => (
          <div key={m}>
            {i > 0 ? <p className="typed mb-2 mt-4">{formatMonth(m)}</p> : null}
            <div
              // `touch-none`: else the browser claims a week-to-week vertical
              // drag as a page scroll (ticket 127).
              className="grid touch-none grid-cols-7 gap-1 text-center"
              role="grid"
              aria-label={`${formatMonth(m)} availability`}
            >
              {WEEKDAY_LABELS.map((label, i) => (
                <span
                  key={i}
                  aria-hidden
                  className="pb-1 font-mono text-[10px] uppercase text-ink-faint"
                >
                  {label}
                </span>
              ))}
              {/* By week, not flattened (ticket 148): the hourly drawer is a
                  `col-span-7` row after the week holding the open day. The
                  Fragment keeps the seven cells as direct grid children. */}
              {monthGrid(m).map((week, wi) => (
                <Fragment key={`w-${wi}`}>
                  {week.map((date, di) =>
                    date === null ? (
                      <span key={`pad-${wi}-${di}`} />
                    ) : (
                      <DayCell
                        key={date}
                        date={date}
                        view={view}
                        free={isFree(date)}
                        tally={tallies[date] ?? 0}
                        memberCount={memberCount}
                        past={date < now}
                        inTrip={
                          !!tripStart &&
                          !!tripEnd &&
                          date >= tripStart &&
                          date <= tripEnd
                        }
                        inRange={
                          view === "dates" &&
                          range.start !== null &&
                          !!rangeEnd &&
                          date >= range.start &&
                          date <= rangeEnd
                        }
                        isToday={date === now}
                        pending={
                          view === "dates" &&
                          !!previewTo &&
                          date > range.start! &&
                          date <= previewTo
                        }
                        openEnd={view === "dates" && halfMade && date === range.start}
                        weather={byDate[date]}
                        weatherOpen={expandedDate === date}
                        onStart={(e) =>
                          view === "dates"
                            ? startRangePick(date, e)
                            : view === "weather"
                              ? undefined
                              : startPaint(date, e)
                        }
                        onToggle={() =>
                          view === "dates"
                            ? pickRange(date)
                            : view === "weather"
                              ? toggleExpand(date)
                              : setEdits({ ...edits, [date]: !isFree(date) })
                        }
                      />
                    ),
                  )}
                  {view === "weather" &&
                  expandedDate &&
                  week.includes(expandedDate) ? (
                    <div className="col-span-7 border-b border-l-2 border-rule border-l-pen bg-sheet-2">
                      <HourlyCurve
                        date={expandedDate}
                        day={byDate[expandedDate]}
                        points={weather?.hourly[expandedDate] ?? []}
                        onClose={() => setExpandedDate(null)}
                      />
                    </div>
                  ) : null}
                </Fragment>
              ))}
            </div>
          </div>
        ))}

      {view === "dates" ? (
        <div className={footer}>
          {/* No text restating the pick (ticket 134). The shrink cost is the one
              thing said, and on the button doing it, not a dialog — the days
              being cut are drawn directly above (ticket 140). */}
          <Button
            variant={armed ? "danger" : "primary"}
            disabled={!range.start || !rangeChanged || pending}
            onClick={onCommit}
          >
            {pending
              ? "Setting…"
              : armed
                ? costLabel
                : tripStart
                  ? "Change dates"
                  : "Set the dates"}
          </Button>
          {datesProblem ? <p className="text-sm text-red">{datesProblem}</p> : null}
          {/* Always here, disabled when nothing to discard (ticket 133) —
              appearing/disappearing re-wrapped the key and moved the card edge. */}
          <Button
            variant="ghost"
            disabled={!rangeChanged}
            onClick={() => setRange({ start: tripStart, end: tripEnd })}
          >
            Discard
          </Button>
          {/* Same key as Everyone (this view draws the same marks) plus the one
              only it has — status is never colour alone. */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <LegendKey swatch="bg-green border-green" label="The trip" />
            <LegendKey swatch="bg-pastel-green border-pastel-green-edge" label="All free" />
            <LegendKey swatch="bg-pastel-red border-pastel-red-edge" label="Some free" />
          </div>
        </div>
      ) : view === "mine" ? (
        <div className={footer}>
          {/* Status is never colour alone — the mark gets a word too. */}
          <span className="mr-auto">
            <LegendKey swatch="bg-pastel-blue border-pastel-blue-edge" label="Days you can do" />
          </span>
          <Button
            variant="primary"
            disabled={changed.length === 0 || pending}
            onClick={onSave}
          >
            {pending
              ? "Saving…"
              : changed.length === 0
                ? "Nothing to save"
                : `Save ${changed.length} ${changed.length === 1 ? "day" : "days"}`}
          </Button>
        </div>
      ) : view === "everyone" ? (
        /* A key, not a paragraph (ticket 76): swatch matches, not reads. */
        <div className={footer}>
          <LegendKey swatch="bg-pastel-green border-pastel-green-edge" label="All free" />
          <LegendKey swatch="bg-pastel-red border-pastel-red-edge" label="Some free" />
          <LegendKey swatch="bg-sheet border-pen" label="The trip" />
        </div>
      ) : weather ? (
        /* Weather (ticket 148): a reading line following the hovered day, plus
           the key, in the same reserved footer. */
        <div className={footer}>
          <WeatherReadout
            hover={hover}
            byDate={byDate}
            placeName={weather.placeName}
            horizonEnd={weather.horizonEnd}
          />
          <div className="flex w-full flex-wrap items-center gap-x-4 gap-y-2">
            <LegendKey swatch="bg-highlight-soft border-highlight" label="Sun" />
            <LegendKey swatch="bg-sheet-3 border-rule-strong" label="Cloud" />
            <LegendKey swatch="bg-pen-soft border-pen-edge" label="Rain" />
            <LegendKey swatch="bg-sheet border-pen" label="In the trip" />
            <LegendKey
              swatch="border-dashed bg-sheet border-rule-strong"
              label="Beyond the forecast"
            />
          </div>
        </div>
      ) : null}
      </div>
    </div>
  );
}

function MonthArrow({ direction }: { direction: "back" | "forward" }) {
  return (
    <svg
      width={13}
      height={13}
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={direction === "back" ? "M8.5 3 4.5 7l4 4" : "M5.5 3l4 4-4 4"} />
    </svg>
  );
}
