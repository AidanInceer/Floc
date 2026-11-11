"use client";

// Why: nights are picked on the month calendar, with where the group sleeps under each week (days-week F).
import { cx } from "@/components/system/ui";
import type { CalendarDay } from "@/components/days/days-calendar-shared";
import { formatMonth, monthGrid, monthOf } from "@floc/core/dates/availability";
import type { IsoDate } from "@floc/core/dates/dates";
import { rangeMark, weekRuns, type WeekRun } from "@floc/core/itinerary/stay/stay-calendar";
import { shortPlace } from "@floc/core/itinerary/names/place-name";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function OvernightCalendar({
  trip,
  pick,
  placeOf,
  onTap,
}: {
  /** The trip's own days, in order. */
  trip: CalendarDay[];
  pick: { start: IsoDate; end: IsoDate };
  /** Where the group sleeps on a trip night after the save; null is not set. */
  placeOf: (date: IsoDate) => string | null;
  onTap: (date: IsoDate) => void;
}) {
  const byDate = new Map(trip.map((d) => [d.date, d]));
  const months = [...new Set(trip.map((d) => monthOf(d.date)))];
  const tripPlace = (date: IsoDate) => (byDate.has(date) ? placeOf(date) : undefined);
  const inPick = (date: IsoDate) => date >= pick.start && date <= pick.end;

  return (
    <div className="grid gap-3.5">
      {months.map((month) => (
        <div key={month}>
          <p className="nums mb-1.5 text-sm text-ink">{formatMonth(month)}</p>
          <div className="grid grid-cols-7" aria-hidden>
            {WEEKDAYS.map((w) => (
              <span key={w} className="typed py-1 text-center">
                {w}
              </span>
            ))}
          </div>
          {monthGrid(month).map((week) => (
            <div key={week.find(Boolean)}>
              <div className="mt-0.5 grid grid-cols-7">
                {week.map((date, i) => (date ? <NightCell key={date} date={date} day={byDate.get(date)} pick={pick} onTap={onTap} /> : <span key={i} />))}
              </div>
              {week.some((date) => date && byDate.has(date)) ? <WeekBars runs={weekRuns(week, tripPlace, inPick)} /> : null}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function NightCell({ date, day, pick, onTap }: { date: IsoDate; day?: CalendarDay; pick: { start: IsoDate; end: IsoDate }; onTap: (date: IsoDate) => void }) {
  const mark = day ? rangeMark(date, pick) : null;
  const number = <b className="nums text-sm font-medium">{Number(date.slice(8))}</b>;
  if (!day) return <span className="flex h-9 items-center justify-center text-ink-faint opacity-45">{number}</span>;
  return (
    <button
      type="button"
      onClick={() => onTap(date)}
      aria-pressed={!!mark}
      aria-label={day.longLabel}
      className={cx(
        "flex h-9 items-center justify-center transition-colors",
        mark ? "bg-pen-soft text-pen-deep" : "rounded-sm text-ink hover:bg-pen-soft",
        mark?.first && "rounded-l-sm",
        mark?.last && "rounded-r-sm",
      )}
    >
      {number}
    </button>
  );
}

function WeekBars({ runs }: { runs: WeekRun[] }) {
  return (
    <div className="mb-1 mt-0.5 grid grid-cols-7 gap-x-0.5" aria-hidden>
      {runs.map((run, i) =>
        "place" in run ? (
          <span
            key={i}
            style={{ gridColumn: `span ${run.span}` }}
            className={cx(
              "h-[18px] min-w-0 truncate rounded-sm px-1.5 text-xs leading-[18px]",
              run.on
                ? "bg-pen-soft font-semibold text-pen-deep"
                : run.place
                  ? "bg-sheet-3 text-ink-soft"
                  : "border border-dashed border-highlight-edge bg-highlight leading-4 text-highlight-ink",
            )}
          >
            {run.place ? shortPlace(run.place) : "Not set"}
          </span>
        ) : (
          <span key={i} style={{ gridColumn: `span ${run.span}` }} />
        ),
      )}
    </div>
  );
}
