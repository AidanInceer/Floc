"use client";

/**
 * Why: one trip week at a time (wireframe/days-week A), so a long trip never
 * scrolls sideways. Stops come from the nights, never stored (rule 3).
 */
import { cx, Button } from "@/components/system/ui";
import { BedIcon } from "@/components/system/icons/days";
import { ChevronIcon, MoonIcon } from "@/components/system/icons";
import type { CalendarDay } from "@/components/days/days-calendar-shared";
import { deriveStops, nightsLabel, type Stop } from "@floc/core/itinerary/stops";
import { stopWeek, type WeekSegment } from "@floc/core/itinerary/stop-weeks";
import type { BandSpan } from "@floc/core/itinerary/overnight-band";
import { shortPlace } from "@floc/core/itinerary/names/place-name";
import { dayParts } from "@floc/core/dates/dates";

export function StopStrip({
  days,
  tripEnd,
  focusId,
  onGoTo,
  onStop,
}: {
  days: CalendarDay[];
  tripEnd: string | null;
  focusId: number;
  onGoTo: (dayId: number) => void;
  onStop: (span: BandSpan) => void;
}) {
  const stops = deriveStops(
    days.map((d) => ({
      dayId: d.id,
      date: d.date,
      overnightPlaceId: d.overnightPlaceId,
      overnightPlaceName: d.overnightPlaceName,
    })),
    tripEnd,
  );
  const week = stopWeek(
    days.map((d) => d.date),
    stops,
    days.findIndex((d) => d.id === focusId),
  );
  const first = week.week * 7;
  const many = week.weeks > 1;
  const step = (to: number | null) => (to === null ? undefined : () => onGoTo(days[to]!.id));

  return (
    <div className="border-b border-rule bg-sheet-2 px-2 py-2 sm:px-3 sm:py-2.5">
      {many ? (
        <p className="nums mb-1.5 text-center text-[11px] text-ink-faint sm:ml-10 sm:text-left">{week.note}</p>
      ) : null}
      <div className={cx("grid items-stretch gap-1 sm:gap-2", many && "grid-cols-[28px_minmax(0,1fr)_28px] sm:grid-cols-[32px_minmax(0,1fr)_32px]")}>
        {many ? <WeekStep side="left" onClick={step(week.before)} /> : null}
        <div className="grid grid-cols-7 gap-[3px] sm:gap-1">
          {week.segments.map((segment) => (
            <StopPill key={segment.stop.startDate} segment={segment} onStop={onStop} />
          ))}
          {week.dates.map((_, i) => {
            const day = days[first + i]!;
            return (
              <button
                key={day.id}
                type="button"
                onClick={() => onGoTo(day.id)}
                aria-current={day.id === focusId ? "date" : undefined}
                title={day.longLabel}
                style={{ gridRow: 2 }}
                className={cx(
                  "flex min-w-0 flex-col items-center justify-center gap-px rounded-sm py-1 transition-colors sm:py-1.5",
                  day.id === focusId ? "bg-pen-soft text-pen-deep" : "hover:bg-pen-soft",
                )}
              >
                <span className={cx("typed", day.id === focusId && "!text-pen-deep")}>{day.weekday}</span>
                <b className="nums text-[15px] font-medium">{day.dayOfMonth}</b>
                {day.isToday ? <span className="sr-only"> — today</span> : null}
              </button>
            );
          })}
          {week.pad.map((date) => {
            const { weekday, day } = dayParts(date);
            return (
              <span
                key={date}
                aria-hidden
                style={{ gridRow: 2 }}
                className="flex min-w-0 flex-col items-center justify-center gap-px py-1 opacity-40 sm:py-1.5"
              >
                <span className="typed">{weekday}</span>
                <b className="nums text-[15px] font-medium">{day}</b>
              </span>
            );
          })}
        </div>
        {many ? <WeekStep side="right" onClick={step(week.after)} /> : null}
      </div>
    </div>
  );
}

function WeekStep({ side, onClick }: { side: "left" | "right"; onClick?: () => void }) {
  const label = side === "left" ? "Week before" : "Week after";
  const end = side === "left" ? "The trip starts here" : "The trip ends here";
  return (
    <Button onClick={onClick} disabled={!onClick} aria-label={label} title={onClick ? label : end} className="!h-auto min-h-8 !w-7 !p-0 sm:!w-8">
      <ChevronIcon direction={side} />
    </Button>
  );
}

function spanOf(stop: Stop): BandSpan {
  return { start: stop.startDate, end: stop.endDate, placeId: stop.placeId, placeName: stop.placeName };
}

function pillLabel(stop: Stop): string {
  return stop.placeName ? `Overnight: ${stop.placeName}, ${nightsLabel(stop.nights)}` : "Overnight: not set";
}

function pillClass({ cutLeft, cutRight, span }: WeekSegment, named: boolean): string {
  return cx(
    "flex h-7 min-w-0 items-center gap-1 overflow-hidden whitespace-nowrap rounded-sm border px-1.5 text-left text-[12.5px] transition-colors sm:gap-1.5 sm:px-2",
    named
      ? "border-pastel-blue-edge bg-pastel-blue text-pastel-blue-ink hover:border-pastel-blue-ink"
      : "border-dashed border-highlight-edge bg-highlight text-highlight-ink hover:border-highlight-ink",
    cutLeft && "rounded-l-none",
    cutRight && "rounded-r-none",
    span === 1 && "max-sm:justify-center",
  );
}

function StopPill({ segment, onStop }: { segment: WeekSegment; onStop: (span: BandSpan) => void }) {
  const { stop, column, span, cutLeft, cutRight } = segment;
  const name = stop.placeName ? shortPlace(stop.placeName) : null;
  return (
    <button
      type="button"
      onClick={() => onStop(spanOf(stop))}
      aria-label={pillLabel(stop)}
      title={name ? `${name} · ${nightsLabel(stop.nights)}` : undefined}
      style={{
        gridRow: 1,
        gridColumn: `${column + 1} / span ${span}`,
        borderLeftStyle: cutLeft ? "dashed" : undefined,
        borderRightStyle: cutRight ? "dashed" : undefined,
      }}
      className={pillClass(segment, name !== null)}
    >
      {cutLeft ? <ChevronIcon direction="left" size={11} className="shrink-0 opacity-70 max-sm:hidden" /> : null}
      <BedIcon size={12} className="shrink-0" />
      <b className={cx("min-w-0 flex-1 truncate font-semibold", span === 1 && "max-sm:hidden")}>{name ?? "Not set"}</b>
      {name && stop.nights > 0 ? (
        <small aria-hidden className={cx("nums flex shrink-0 items-center gap-0.5 text-[11px]", span <= 2 && "max-sm:hidden")}>
          {stop.nights}
          <MoonIcon size={11} />
        </small>
      ) : null}
      {cutRight ? <ChevronIcon direction="right" size={11} className="shrink-0 opacity-70 max-sm:hidden" /> : null}
    </button>
  );
}
