"use client";

import { addMonths, formatMonth, type IsoMonth } from "@floc/core/dates/availability";
import { addDays, formatDate, today, type IsoDate } from "@floc/core/dates/dates";

import { MonthGrid, type DayView } from "@/components/availability/month-grid";
import { ChevronIcon } from "@/components/system/icons";
import { Button } from "@/components/system/ui";

/** Dates' own calendar, never the browser's: tap a start day and the listing's nights run on from it as one trip run. */
export function StartCalendar({ month, onMonth, start, nights, onPick }: {
  month: IsoMonth;
  onMonth: (month: IsoMonth) => void;
  start: IsoDate | null;
  nights: number;
  onPick: (date: IsoDate) => void;
}) {
  const now = today();
  const end = start ? addDays(start, nights) : null;
  const view = (date: IsoDate): DayView => {
    const inStay = start !== null && end !== null && date >= start && date <= end;
    const gone = date <= now;
    return {
      mark: inStay ? { kind: "trip" } : { kind: "none" },
      mine: false,
      past: gone,
      today: date === now,
      cut: false,
      label: [formatDate(date), date === start && "start", inStay && "on the trip"].filter(Boolean).join(", "),
      press: null,
      activate: gone ? null : () => onPick(date),
      selected: date === start,
    };
  };
  const round = "!size-8 !p-0";
  return (
    <div className="mx-auto grid w-full max-w-80 gap-2">
      <div className="flex items-center justify-between">
        <Button type="button" className={round} aria-label="Earlier month" disabled={month <= now.slice(0, 7)} onClick={() => onMonth(addMonths(month, -1))}>
          <ChevronIcon direction="left" />
        </Button>
        <p className="nums text-sm text-ink" aria-live="polite">{formatMonth(month)}</p>
        <Button type="button" className={round} aria-label="Later month" onClick={() => onMonth(addMonths(month, 1))}>
          <ChevronIcon direction="right" />
        </Button>
      </div>
      <MonthGrid month={month} view={view} />
    </div>
  );
}
