"use client";

import { monthOf, type IsoMonth } from "@floc/core/dates/availability";
import { addDays, formatDateRange, type IsoDate } from "@floc/core/dates/dates";
import type { StartMonth } from "@floc/core/trip/explore/copy/start-months";
import { MONTH_SHORT } from "@floc/core/trip/explore/finder/finder-words";

import { StartCalendar } from "@/components/explore/copy/start-calendar";
import { cx, panelTitleClass } from "@/components/system/ui";

const chip = cx(
  "grid min-w-[3.25rem] place-items-center rounded-sm border px-2 py-1.5 transition-colors sm:min-w-[4.25rem] sm:px-2.5",
  "border-rule-strong bg-sheet text-ink-soft hover:border-ink-faint",
  "aria-pressed:border-pen aria-pressed:bg-pen-soft aria-pressed:text-pen-deep",
);

/** Step two (ADR-025): a best month starts on its 1st; the calendar takes any day still ahead. */
export function WhenStep({ months, nights, start, month, onStart, onMonth }: {
  months: StartMonth[];
  nights: number;
  start: IsoDate | null;
  month: IsoMonth;
  onStart: (date: IsoDate) => void;
  onMonth: (month: IsoMonth) => void;
}) {
  const pickMonth = (m: StartMonth) => {
    onStart(m.startDate);
    onMonth(monthOf(m.startDate));
  };
  return (
    <div className="grid gap-4 text-center">
      <h3 tabIndex={-1} className={panelTitleClass}>When do you start?</h3>
      {months.length ? (
        <div className="grid justify-items-center gap-2">
          <span className="typed">Best months</span>
          <div className="flex flex-wrap justify-center gap-1.5">
            {months.map((m) => (
              <button key={m.startDate} type="button" aria-pressed={start === m.startDate} onClick={() => pickMonth(m)} className={chip}>
                <b className="text-sm font-semibold">{MONTH_SHORT[m.month - 1]}</b>
                <span className="nums text-[11px] opacity-75">{m.year}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <StartCalendar month={month} onMonth={onMonth} start={start} nights={nights} onPick={onStart} />
      <p className="nums min-h-5 text-sm text-ink-soft">{start ? `${formatDateRange(start, addDays(start, nights))} · ${nights} nights` : ""}</p>
    </div>
  );
}
