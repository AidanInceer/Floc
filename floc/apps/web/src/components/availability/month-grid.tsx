"use client";

import { DateCell, type DateCellProps } from "@/components/availability/date-cell";
import { WEEKDAY_LABELS, formatMonth, monthGrid, type IsoMonth } from "@floc/core/dates/availability";
import { markKey, weekJoins, type DayMark } from "@floc/core/dates/day-marks";

export type DayView = Omit<DateCellProps, "date" | "join" | "mark"> & { mark: DayMark };

/** One month, week by week, so a run of the same mark can join into one shape. */
export function MonthGrid({ month, view }: { month: IsoMonth; view: (date: string) => DayView }) {
  return (
    <div
      // `touch-none`: else the browser claims a week-to-week drag as a page scroll (ticket 127).
      className="grid touch-none grid-cols-7 gap-y-[3px]"
      role="grid"
      aria-label={formatMonth(month)}
    >
      {WEEKDAY_LABELS.map((l, i) => (
        <span key={i} aria-hidden className="pb-1 text-center font-mono text-[10px] text-ink-faint">
          {l}
        </span>
      ))}
      {monthGrid(month).flatMap((week, wi) => {
        const days = week.map((d) => (d ? view(d) : null));
        const joins = weekJoins(days.map((v) => (v ? markKey(v.mark) : null)));
        return week.map((date, di) =>
          date ? <DateCell key={date} date={date} join={joins[di]} {...days[di]!} /> : <span key={`pad-${wi}-${di}`} />,
        );
      })}
    </div>
  );
}
