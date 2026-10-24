"use client";

/**
 * The trip's days in one row, grouped under the stop each night belongs to
 * (B5). A stop is derived from the nights, never stored (rule 3). A day goes
 * to that day; a stop opens the overnight dialog on its whole run.
 */
import { cx } from "@/components/system/ui";
import { BedIcon } from "@/components/days/days-glyphs";
import type { CalendarDay } from "@/components/days/days-calendar-shared";
import { deriveStops, nightsLabel } from "@floc/core/itinerary/stops";
import type { BandSpan } from "@floc/core/itinerary/overnight-band";

export const shortPlace = (name: string) => name.split(",")[0];

export function StopStrip({
  days,
  focusId,
  onGoTo,
  onStop,
}: {
  days: CalendarDay[];
  focusId: number;
  onGoTo: (dayId: number) => void;
  onStop: (span: BandSpan) => void;
}) {
  const byId = new Map(days.map((d) => [d.id, d]));
  const stops = deriveStops(
    days.map((d) => ({
      dayId: d.id,
      date: d.date,
      overnightPlaceId: d.overnightPlaceId,
      overnightPlaceName: d.overnightPlaceName,
    })),
  );

  return (
    <div className="flex gap-0.5 border-b border-rule bg-sheet-2 px-1.5 py-2 sm:gap-1.5 sm:px-3 sm:py-2.5">
      {stops.map((stop) => (
        <div key={stop.startDate} className="flex min-w-0 flex-col gap-1" style={{ flex: stop.dayIds.length }}>
          <button
            type="button"
            onClick={() =>
              onStop({ start: stop.startDate, end: stop.endDate, placeId: stop.placeId, placeName: stop.placeName })
            }
            aria-label={`Overnight: ${stop.placeName ?? "not set"}`}
            className={cx(
              "flex min-w-0 items-center justify-center gap-1 whitespace-nowrap rounded-full px-1.5 py-0.5 text-[11.5px] transition-shadow sm:justify-start sm:gap-1.5 sm:px-2.5 sm:text-[12.5px]",
              stop.placeName
                ? "bg-sheet-3 text-ink-soft hover:shadow-[inset_0_0_0_1px_var(--color-rule-strong)]"
                : "border border-dashed border-highlight-edge bg-highlight-soft text-highlight-ink hover:border-highlight-ink",
            )}
          >
            <BedIcon size={12} />
            <b className={cx("truncate font-medium", stop.placeName ? "text-ink" : "max-sm:hidden")}>
              {stop.placeName ? shortPlace(stop.placeName) : "Not set"}
            </b>
            {stop.placeName ? (
              <small className="nums text-[11px] text-ink-faint max-sm:hidden">
                {nightsLabel(stop.nights)}
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
                    "flex min-w-0 flex-1 flex-col items-center justify-center gap-px rounded-lg py-1 sm:flex-row sm:gap-1.5 sm:py-1.5",
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
  );
}
