"use client";

import { addMonths, formatMonth, type IsoMonth } from "@floc/core/dates/availability";
import { formatDate, today, type IsoDate } from "@floc/core/dates/dates";

import { MonthGrid, type DayView } from "@/components/availability/month-grid";
import { ChevronIcon } from "@/components/system/icons";
import { Button } from "@/components/system/ui";

export function RangeCalendar({ month, onMonth, start, end, onPick }: {
  month: IsoMonth;
  onMonth: (month: IsoMonth) => void;
  start: IsoDate | null;
  end: IsoDate | null;
  onPick: (date: IsoDate) => void;
}) {
  const now = today();
  const view = (date: IsoDate): DayView => {
    const inside = start !== null && date >= start && date <= (end ?? start);
    const gone = date < now;
    return {
      mark: inside ? { kind: "trip" } : { kind: "none" },
      mine: false,
      past: gone,
      today: date === now,
      cut: false,
      label: [formatDate(date), date === start && "first day", date === end && "last day"].filter(Boolean).join(", "),
      press: null,
      activate: gone ? null : () => onPick(date),
      selected: date === start || date === end,
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
