"use client";

/**
 * The trip's days in one row, grouped under the stop each night belongs to
 * (B5). A stop is derived from the nights, never stored (rule 3). A day goes
 * to that day; a stop opens the overnight dialog on its whole run.
 */
import { useEffect, useRef, type CSSProperties } from "react";

import { cx } from "@/components/system/ui";
import { BedIcon } from "@/components/system/icons/days";
import { MoonIcon } from "@/components/system/icons";
import type { CalendarDay } from "@/components/days/days-calendar-shared";
import { deriveStops, nightsLabel } from "@floc/core/itinerary/stops";
import type { BandSpan } from "@floc/core/itinerary/overnight-band";
import { shortPlace } from "@floc/core/itinerary/names/place-name";

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
  const scroller = useRef<HTMLDivElement>(null);
  // Why: scrollIntoView would also move the page; only the strip may scroll.
  useEffect(() => {
    const box = scroller.current;
    const on = box?.querySelector<HTMLElement>("[aria-current='date']");
    if (!box || !on) return;
    const from = on.getBoundingClientRect().left - box.getBoundingClientRect().left;
    const to = from + on.offsetWidth;
    if (from < 0) box.scrollLeft += from - 8;
    else if (to > box.clientWidth) box.scrollLeft += to - box.clientWidth + 8;
  }, [focusId]);

  const byId = new Map(days.map((d) => [d.id, d]));
  const stops = deriveStops(
    days.map((d) => ({
      dayId: d.id,
      date: d.date,
      overnightPlaceId: d.overnightPlaceId,
      overnightPlaceName: d.overnightPlaceName,
    })),
    tripEnd,
  );

  return (
    <div ref={scroller} className="scroll-x-bare border-b border-rule bg-sheet-2">
      <div
        className="flex gap-0.5 px-1.5 py-2 min-w-[calc(var(--days)*3rem+0.75rem)] sm:min-w-[calc(var(--days)*5.25rem+1.5rem)] sm:gap-1.5 sm:px-3 sm:py-2.5"
        style={{ "--days": days.length } as CSSProperties}
      >
        {stops.map((stop) => (
          <div key={stop.startDate} className="flex min-w-0 flex-col gap-1" style={{ flex: stop.dayIds.length }}>
            <button
              type="button"
              onClick={() =>
                onStop({ start: stop.startDate, end: stop.endDate, placeId: stop.placeId, placeName: stop.placeName })
              }
              aria-label={`Overnight: ${stop.placeName ?? "not set"}${stop.placeName ? `, ${nightsLabel(stop.nights)}` : ""}`}
              title={stop.placeName ? `${shortPlace(stop.placeName)} · ${nightsLabel(stop.nights)}` : undefined}
              className={cx(
                "flex min-w-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-full px-1.5 py-0.5 text-[11.5px] transition-shadow sm:justify-start sm:gap-1.5 sm:px-2.5 sm:text-[12.5px]",
                stop.placeName
                  ? "bg-sheet-3 text-ink-soft hover:shadow-[inset_0_0_0_1px_var(--color-rule-strong)]"
                  : "border border-dashed border-highlight-edge bg-highlight-soft text-highlight-ink hover:border-highlight-ink",
              )}
            >
              <BedIcon size={12} />
              <b className={cx("min-w-0 truncate font-medium", stop.placeName ? "text-ink" : "max-sm:hidden")}>
                {stop.placeName ? shortPlace(stop.placeName) : "Not set"}
              </b>
              {stop.placeName ? (
                <small aria-hidden className="nums flex shrink-0 items-center gap-0.5 text-[11px] text-ink-faint max-sm:hidden">
                  {stop.nights}
                  <MoonIcon size={11} />
                </small>
              ) : null}
            </button>
            <div className="flex gap-0.5 sm:gap-1">
              {stop.dayIds.map((id) => {
                const day = byId.get(id)!;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onGoTo(id)}
                    aria-current={id === focusId ? "date" : undefined}
                    title={day.longLabel}
                    className={cx(
                      "flex min-w-0 flex-1 flex-col items-center justify-center gap-px rounded-sm py-1 sm:flex-row sm:gap-1.5 sm:py-1.5",
                      id === focusId ? "bg-pen-soft text-pen-deep" : "hover:bg-sheet-3",
                    )}
                  >
                    <span className={cx("typed", id === focusId && "!text-pen-deep")}>{day.weekday}</span>
                    <b className="nums text-[15px] font-medium">{day.dayOfMonth}</b>
                    {day.isToday ? <span className="sr-only"> — today</span> : null}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
