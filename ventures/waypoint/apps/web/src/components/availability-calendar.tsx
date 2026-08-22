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
import { Fragment, useRef, useState, useTransition } from "react";

import { Button, LegendKey, cx } from "@/components/ui";
import { WeatherGlyph } from "@/components/weather-glyph";
import {
  WEEKDAY_LABELS,
  addMonths,
  formatMonth,
  monthGrid,
  monthsFrom,
  type IsoMonth,
} from "@/lib/availability";
import { dateRange, formatDate, today, type IsoDate } from "@/lib/dates";
import type { WeatherCondition } from "@/lib/weather";
import {
  windowCost,
  windowCostLabel,
  type DayLoad,
} from "@/lib/trip-window";
import type { DailyForecast, HourlyPoint, TripForecast } from "@/server/weather";

type View = "mine" | "everyone" | "dates" | "weather";

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
  save: (add: string[], remove: string[]) => Promise<void>;
  saveDates: (start: string | null, end: string | null) => Promise<void>; // null/null clears
}) {
  const [view, setView] = useState<View>("mine");
  const [month, setMonth] = useState(firstMonth);
  const [pending, startTransition] = useTransition();
  const surface = useRef<HTMLDivElement>(null);

  const hasWeather = weather !== null;
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

  const pickRange = (date: string) => {
    // A click before the start means "from here instead" — nobody means "end
    // before start", so no `min` needed.
    setRange((r) =>
      r.start === null || r.end !== null || date < r.start
        ? { start: date, end: null }
        : { ...r, end: date },
    );
  };

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
    setRange(
      date === rangeDrag
        ? { start: rangeDrag, end: null }
        : date < rangeDrag
          ? { start: date, end: rangeDrag }
          : { start: rangeDrag, end: date },
    );
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
    const span = dateRange(
      drag.anchor <= date ? drag.anchor : date,
      drag.anchor <= date ? date : drag.anchor,
    );
    const next = { ...drag.base };
    for (const d of span) next[d] = drag.target;
    setEdits(next);
  };

  const onSave = () =>
    startTransition(async () => {
      await save(add, remove);
      setEdits({});
    });

  const onSaveDates = () =>
    startTransition(async () => {
      await saveDates(range.start, rangeEnd);
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
    "mt-5 flex min-h-[calc(2rem+0.5rem+2rem+1rem+1px)] flex-wrap content-start items-center gap-x-4 gap-y-2 border-t border-rule pt-4";

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
      {/* One row at every width (ticket 134): a wrap stranded the arrows on
          their own line. */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="inline-flex shrink-0 gap-1 rounded-full bg-sheet/60 p-1">
          {(hasWeather
            ? (["mine", "everyone", "dates", "weather"] as const)
            : (["mine", "everyone", "dates"] as const)
          ).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => changeView(v)}
              className={cx(
                // `whitespace-nowrap`: survive being squeezed next to the arrows
                // rather than breaking "The dates" over two lines.
                "whitespace-nowrap rounded-full px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.06em] transition-colors sm:px-3",
                view === v
                  ? "bg-pen text-sheet"
                  : "text-ink-soft hover:bg-sheet",
              )}
            >
              {v === "mine"
                ? "Mine"
                : v === "everyone"
                  ? "Everyone"
                  : v === "dates"
                    ? "The dates"
                    : "Weather"}
            </button>
          ))}
        </div>

        {/* Arrows give up width, not the switch — a squeeze clipped "The dates". */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            className="!px-2"
            aria-label="Earlier months"
            onClick={() => setMonth(addMonths(month, -1))}
          >
            ←
          </Button>
          <Button
            variant="ghost"
            className="!px-2"
            aria-label="Later months"
            onClick={() => setMonth(addMonths(month, 1))}
          >
            →
          </Button>
        </div>
      </div>

      <div>
        {months.map((m) => (
          <div key={m}>
            <p className="typed mb-2">{formatMonth(m)}</p>
            <div
              // `touch-none`: else the browser claims a week-to-week vertical
              // drag as a page scroll (ticket 127). Ruled paper, not boxes — one
              // rule under each week, cells abut (ticket 129).
              className="grid touch-none grid-cols-7 border-t border-rule text-center"
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
                      <span
                        key={`pad-${wi}-${di}`}
                        className="border-b border-rule"
                      />
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
      </div>

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
            <LegendKey swatch="bg-green-soft border-green" label="All free" />
            <LegendKey swatch="bg-red-soft border-red" label="Some missing" />
          </div>
        </div>
      ) : view === "mine" ? (
        <div className={footer}>
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
          <Button
            variant="ghost"
            disabled={changed.length === 0}
            onClick={() => setEdits({})}
          >
            Discard
          </Button>
          {/* Status is never colour alone — the mark gets a word too. */}
          <LegendKey swatch="bg-pen-soft border-pen" label="Days you can do" />
        </div>
      ) : view === "everyone" ? (
        /* A key, not a paragraph (ticket 76): swatch matches, not reads. */
        <div className={footer}>
          <LegendKey swatch="bg-green-soft border-green" label="All free" />
          <LegendKey swatch="bg-red-soft border-red" label="Some missing" />
          <LegendKey swatch="bg-sheet-2 border-rule" label="No answer yet" />
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
            <LegendKey swatch="bg-green border-green" label="In the trip" />
            <LegendKey
              swatch="border-dashed bg-sheet border-rule-strong"
              label="Beyond the forecast"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DayCell({
  date,
  view,
  free,
  tally,
  memberCount,
  past,
  inTrip,
  inRange,
  isToday,
  pending,
  openEnd,
  weather,
  weatherOpen,
  onStart,
  onToggle,
}: {
  date: string;
  view: View;
  free: boolean;
  tally: number;
  memberCount: number;
  past: boolean;
  inTrip: boolean;
  inRange: boolean; // inside the window being picked (dates view)
  isToday: boolean;
  pending?: boolean; // inside the span the pointer proposes (ticket 135)
  openEnd?: boolean; // picked start with no end yet
  weather?: DailyForecast; // undefined past the horizon
  weatherOpen?: boolean;
  onStart: (e: React.PointerEvent) => void;
  onToggle: () => void;
}) {
  const dayNumber = Number(date.slice(8, 10));

  // Shared cell chrome: one rule under the week, no box around the day (ticket 129).
  const cell =
    "relative flex aspect-square flex-col items-center justify-center border-b border-ink/10 font-mono text-[11px] leading-none";

  // Focus ring on the mark, not the cell (ticket 129): the square cell outline
  // drew a blue box around the round mark.
  const focusRing =
    "group-focus-visible:ring-2 group-focus-visible:ring-pen group-focus-visible:ring-offset-1 group-focus-visible:ring-offset-sheet";

  // Three states, not a ramp (ticket 67): either the whole group is free (green)
  // or the day costs somebody (red); no answer yet is the plain sheet, not a bad
  // answer. Exact count rides on `title`/aria, not a number under the mark.
  const groupMark =
    tally === 0
      ? "text-ink-faint"
      : tally === memberCount
        ? "bg-green-soft text-green"
        : "bg-red-soft text-red";

  // Weather (ticket 148): the disc is the condition, day number in the corner,
  // so a run of sun reads as a shape. Inside the horizon a day opens its hourly
  // drawer; past it, a non-interactive dashed ring (no drawer onto no data).
  if (view === "weather") {
    const corner = (
      <span
        aria-hidden
        className="absolute left-1 top-0.5 font-mono text-[9px] leading-none text-ink-faint"
      >
        {dayNumber}
      </span>
    );
    const discBase =
      "flex h-[70%] w-[70%] items-center justify-center rounded-full transition-colors";
    const windowRing = inTrip || isToday ? "ring-1 ring-pen" : "";

    // Outside the window: no weather at all, not even a dashed ring (ticket 148).
    if (!inTrip) {
      return (
        <span
          role="gridcell"
          data-date={date}
          className={cx(cell, "opacity-70")}
        >
          {corner}
        </span>
      );
    }

    if (!weather) {
      return (
        <span
          role="gridcell"
          data-date={date}
          title={`${date} — beyond the forecast`}
          className={cx(cell, past && "opacity-70")}
        >
          {corner}
          <span
            aria-hidden
            className={cx(
              discBase,
              "border border-dashed border-rule-strong",
              windowRing,
            )}
          />
        </span>
      );
    }

    return (
      <button
        type="button"
        role="gridcell"
        data-date={date}
        aria-expanded={weatherOpen}
        aria-label={`${date} — ${weather.label}, high ${weather.hi}°, low ${weather.lo}°`}
        title={`${date} — ${weather.label}, ${weather.hi}° / ${weather.lo}°`}
        onClick={onToggle}
        className={cx(
          cell,
          "group transition-colors focus-visible:outline-none",
          past && "opacity-70",
        )}
      >
        {corner}
        <span
          className={cx(
            discBase,
            focusRing,
            DISC_TINT[weather.condition],
            weather.condition === "rain" ? "text-pen" : "text-ink-soft",
            windowRing,
            // Hover previews the open day's pen ring, so it reads without the cursor.
            "group-hover:ring-2 group-hover:ring-pen",
            weatherOpen && "ring-2 ring-pen",
          )}
        >
          <WeatherGlyph condition={weather.condition} size={20} />
        </span>
      </button>
    );
  }

  if (view === "everyone") {
    return (
      <span
        role="gridcell"
        title={`${date} — ${tally} of ${memberCount} free`}
        className={cx(cell, past && "opacity-70")}
      >
        <span
          className={cx(
            "flex h-[70%] w-[70%] items-center justify-center rounded-full",
            inTrip ? "bg-green font-semibold text-sheet" : groupMark,
          )}
        >
          {dayNumber}
        </span>
      </span>
    );
  }

  // Two things one cell shows (ticket 128): painting availability it's on/off;
  // picking the window it shows the group's washes, since choosing a week is a
  // decision about who can make it. An in-window day overrides with solid green.
  const picking = view === "dates";
  const marked = picking ? inRange : free;

  return (
    <button
      type="button"
      role="gridcell"
      // `aria-selected`, not `aria-pressed`: a gridcell doesn't support the
      // toggle-button state, so a screen reader was told nothing about whether
      // the day was on (ticket 204). The visible label says it too.
      aria-selected={marked}
      aria-label={
        picking
          ? `${date} — ${tally} of ${memberCount} free${inRange ? ", in the trip" : ""}${openEnd ? ", start of the window" : ""}${pending ? ", in the window being picked" : ""}`
          : `${date}${free ? " — you're free" : ""}`
      }
      title={picking ? `${date} — ${tally} of ${memberCount} free` : undefined}
      data-date={date} // what the surface hit-tests each move (see startPaint)
      onPointerDown={onStart}
      // Keyboard Enter/Space arrive as a click with `detail === 0` and no
      // `pointerdown` — the only way this cell is reachable from the keyboard.
      onClick={(e) => {
        if (e.detail === 0) onToggle();
      }}
      className={cx(
        cell,
        "group transition-colors focus-visible:outline-none",
        past && "opacity-70",
      )}
    >
      <span
        className={cx(
          "flex h-[70%] w-[70%] items-center justify-center rounded-full transition-colors",
          focusRing,
          // Picking: the group's answer, chosen days pressed into solid green.
          picking && (inRange ? "bg-green font-semibold text-sheet" : groupMark),
          // The span you'd get by clicking here: solid green at half strength (ticket 135).
          picking && pending && "bg-green/45 font-semibold text-sheet",
          // Start with no end: ringed, else a lone solid day read as a one-day trip.
          picking && openEnd && "ring-2 ring-pen ring-offset-1 ring-offset-sheet",
          // Blue, because a day you marked is your own answer (ticket 197) —
          // green is reserved for the run the whole group can do.
          !picking && free && "bg-pen-soft font-semibold text-pen-deep ring-1 ring-pen",
          !picking && !free && "text-ink-soft",
          isToday && !free && !inRange && "ring-1 ring-pen", // today circled

        )}
      >
        {dayNumber}
      </span>
    </button>
  );
}

// Disc wash per condition (ticket 148): sun is the highlighter, rain the biro
// wash; part/cloud share the neutral sheet, told apart by glyph and word.
const DISC_TINT: Record<WeatherCondition, string> = {
  sun: "bg-highlight-soft",
  part: "bg-sheet-3",
  cloud: "bg-sheet-3",
  rain: "bg-pen-soft",
};

// Reading line under the weather calendar: temperatures for the hovered day; at
// rest it names the place and horizon, so the row is never empty.
function WeatherReadout({
  hover,
  byDate,
  placeName,
  horizonEnd,
}: {
  hover: string | null;
  byDate: Record<IsoDate, DailyForecast>;
  placeName: string;
  horizonEnd: IsoDate;
}) {
  const wx = hover ? byDate[hover] : undefined;

  if (hover && wx) {
    return (
      <div className="flex w-full items-center gap-3">
        <span className={cx(wx.condition === "rain" ? "text-pen" : "text-ink-soft")}>
          <WeatherGlyph condition={wx.condition} size={22} />
        </span>
        <span className="nums text-[12px] text-ink-soft">{formatDate(hover)}</span>
        <span className="text-sm text-ink">{wx.label}</span>
        <span className="nums ml-auto whitespace-nowrap">
          <span className="text-[15px] text-ink">{wx.hi}°</span>{" "}
          <span className="text-[12px] text-ink-faint">{wx.lo}°</span>
        </span>
      </div>
    );
  }

  if (hover) {
    return (
      <div className="flex w-full items-center gap-3">
        <span className="nums text-[12px] text-ink-soft">{formatDate(hover)}</span>
        <span className="text-sm text-ink-faint">Beyond the forecast</span>
      </div>
    );
  }

  return (
    <div className="flex w-full items-center">
      <span className="typed">
        {placeName} · to {formatDate(horizonEnd)}
      </span>
    </div>
  );
}

// Hourly forecast for one day (ticket 148, prototype C2): a temperature curve,
// not a table — the shape is the point. Exact figures ride on each `title`.
// Fixed 700×132 viewBox scaled by width, ratio kept, so geometry is arithmetic.
function HourlyCurve({
  date,
  day,
  points,
  onClose,
}: {
  date: IsoDate;
  day?: DailyForecast;
  points: HourlyPoint[];
  onClose: () => void;
}) {
  const W = 700;
  const H = 132;
  const padL = 26;
  const padR = 26;
  const top = 34;
  const base = 96;
  const rainY = H - 18;

  const temps = points.map((p) => p.temp);
  const lo = temps.length ? Math.min(...temps) : 0;
  const hi = temps.length ? Math.max(...temps) : 1;
  const span = Math.max(hi - lo, 1);
  const x = (i: number) =>
    points.length > 1
      ? padL + i * ((W - padL - padR) / (points.length - 1))
      : W / 2;
  const y = (t: number) => top + (1 - (t - lo) / span) * (base - top);
  const line = points
    .map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p.temp).toFixed(1)}`)
    .join(" ");

  return (
    <div className="px-3 py-2.5">
      <div className="mb-1.5 flex items-center gap-2.5">
        <span className="nums text-[12px] text-ink">{formatDate(date)}</span>
        {day ? <span className="text-[13px] text-ink-soft">{day.label}</span> : null}
        {day ? (
          <span className="nums ml-auto text-[12px] text-ink-soft">
            {day.hi}° / {day.lo}°
          </span>
        ) : (
          <span className="ml-auto" />
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close hourly forecast"
          className="grid place-items-center rounded-sm border border-rule-strong p-1 text-ink-faint transition-colors hover:border-pen hover:text-pen"
        >
          <svg
            viewBox="0 0 24 24"
            width="12"
            height="12"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.7}
            strokeLinecap="round"
            aria-hidden
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      {points.length > 1 ? (
        <div className="relative">
          {/* Glyphs only where the condition changes — all eight hid the curve. */}
          {points.map((p, i) =>
            i > 0 && points[i - 1].condition === p.condition ? null : (
              <span
                key={`g-${p.hour}`}
                className={cx(
                  "absolute top-0 -translate-x-1/2",
                  p.condition === "rain" ? "text-pen" : "text-ink-soft",
                )}
                style={{ left: `${(x(i) / W) * 100}%` }}
              >
                <WeatherGlyph condition={p.condition} size={17} />
              </span>
            ),
          )}
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="block h-auto w-full"
            role="img"
            aria-label={`Hourly temperature for ${formatDate(date)}`}
          >
            <line
              x1={padL}
              y1={rainY}
              x2={W - padR}
              y2={rainY}
              className="stroke-rule"
              strokeWidth={1}
            />
            {points.map((p, i) =>
              p.pop > 0 ? (
                <rect
                  key={`r-${p.hour}`}
                  x={x(i) - 13}
                  y={rainY - (3 + (p.pop / 100) * 15)}
                  width={26}
                  height={3 + (p.pop / 100) * 15}
                  rx={1.5}
                  className="fill-pen opacity-40"
                >
                  <title>{`${p.hour} — ${p.pop}% chance of rain`}</title>
                </rect>
              ) : null,
            )}
            <path
              d={line}
              className="fill-none stroke-pen"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {points.map((p, i) => (
              <g key={`p-${p.hour}`}>
                <circle
                  cx={x(i)}
                  cy={y(p.temp)}
                  r={3.4}
                  className="fill-sheet-2 stroke-pen"
                  strokeWidth={1.6}
                >
                  <title>{`${p.hour} — ${p.temp}°${p.pop > 0 ? `, ${p.pop}% rain` : ""}`}</title>
                </circle>
                <text
                  x={x(i)}
                  y={y(p.temp) - 9}
                  textAnchor="middle"
                  className="fill-ink font-mono"
                  fontSize={10}
                >
                  {p.temp}°
                </text>
                <text
                  x={x(i)}
                  y={H - 4}
                  textAnchor="middle"
                  className="fill-ink-faint font-mono"
                  fontSize={9}
                >
                  {p.hour}
                </text>
              </g>
            ))}
          </svg>
        </div>
      ) : null}

      <div className="mt-1 flex items-center gap-4 text-[11px] text-ink-soft">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="h-0.5 w-4 rounded-full bg-pen" />
          Temperature
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="h-2.5 w-3 rounded-sm bg-pen opacity-40" />
          Chance of rain
        </span>
      </div>
    </div>
  );
}
