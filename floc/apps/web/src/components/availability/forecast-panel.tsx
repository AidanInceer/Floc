"use client";

/**
 * The Forecast tab's panel: the trip's days as a list, and one day's hours in its place
 * when a day is pressed. Rows, not a chart: time, sky, temperature, and rain only when there is some.
 */
import { ChevronIcon } from "@/components/system/icons";
import { cx } from "@/components/system/ui";
import { WeatherGlyph } from "@/components/system/weather-glyph";
import { dayParts, formatDate, type IsoDate } from "@floc/core/dates/dates";
import type { DailyForecast, HourlyPoint } from "@/server/itinerary/weather";

const label = "font-mono text-[11px] uppercase tracking-[0.06em] text-ink-faint";

export function ForecastPanel({
  days,
  byDate,
  hourly,
  placeName,
  horizonEnd,
  selected,
  onSelect,
}: {
  days: IsoDate[];
  byDate: Record<IsoDate, DailyForecast>;
  hourly: Record<IsoDate, HourlyPoint[]>;
  placeName: string;
  horizonEnd: IsoDate;
  selected: IsoDate | null;
  onSelect: (date: IsoDate | null) => void;
}) {
  const day = selected ? byDate[selected] : undefined;
  if (selected && day) return <DayHours date={selected} day={day} points={hourly[selected] ?? []} back={() => onSelect(null)} />;

  return (
    <div className="p-4">
      <div className="flex items-baseline justify-between gap-2">
        <p className={label}>{placeName}</p>
        <p className={label}>To {formatDate(horizonEnd)}</p>
      </div>
      <ul className="mt-2">
        {days.map((d, i) => {
          const w = byDate[d];
          const { weekday, day: n } = dayParts(d);
          const when = <span className="nums font-mono text-ink">{weekday} {n}</span>;
          const row = cx("grid w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-[13.5px]", i > 0 && "border-t border-rule");
          return (
            <li key={d}>
              {w ? (
                <button type="button" onClick={() => onSelect(d)} className={cx(row, "grid-cols-[3.4rem_16px_minmax(0,1fr)_auto] hover:bg-sheet-2")}>
                  {when}
                  <span className="text-ink-soft"><WeatherGlyph condition={w.condition} /></span>
                  <span className="truncate text-ink-soft">{w.label}</span>
                  <span className="nums">
                    {w.hi}°<small className="ml-1 text-[11.5px] text-ink-faint">{w.lo}°</small>
                  </span>
                </button>
              ) : (
                <span className={cx(row, "grid-cols-[3.4rem_minmax(0,1fr)] text-ink-faint")}>
                  {when}
                  <span>Beyond the forecast</span>
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function DayHours({ date, day, points, back }: { date: IsoDate; day: DailyForecast; points: HourlyPoint[]; back: () => void }) {
  const { weekday, day: n } = dayParts(date);
  return (
    <div className="p-4">
      <button
        type="button"
        onClick={back}
        className="-ml-1 -mt-1 mb-3 inline-flex items-center gap-1 rounded-lg py-1 pl-1 pr-2 text-[13px] text-ink-soft hover:bg-sheet-2 hover:text-ink"
      >
        <ChevronIcon direction="left" />
        All days
      </button>
      <p className={label}>
        {weekday} {n}
      </p>
      <div className="mb-3 mt-1.5 flex items-center gap-3">
        <span className="text-ink-soft">
          <WeatherGlyph condition={day.condition} size={30} />
        </span>
        <b className="nums font-display text-[38px] font-semibold leading-none tracking-[-0.02em]">{day.hi}°</b>
        <span className="text-[12.5px] leading-snug text-ink-soft">
          {day.label}
          <br />
          Low {day.lo}°
        </span>
      </div>
      <ol>
        {points.map((h) => (
          <li
            key={h.hour}
            className="grid grid-cols-[3.4rem_16px_minmax(0,1fr)_auto] items-center gap-2.5 border-t border-rule px-0.5 py-2 text-[13.5px]"
          >
            <span className="nums font-mono text-ink-soft">{h.hour}</span>
            <span className="text-ink-soft"><WeatherGlyph condition={h.condition} /></span>
            <b className="nums font-medium">{h.temp}°</b>
            <span className="nums font-mono text-[11px] text-pen" aria-label={h.pop ? `${h.pop}% chance of rain` : undefined}>{h.pop ? `${h.pop}%` : ""}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
