"use client";

import { Fragment, type ReactNode } from "react";
import { AsideHead } from "@/components/availability/dates-board-parts";
import { ChevronIcon } from "@/components/system/icons";
import { cx } from "@/components/system/ui";
import { WeatherGlyph } from "@/components/system/icons/weather";
import { dayParts, formatDate, type IsoDate } from "@floc/core/dates/dates";
import { stopStarts } from "@floc/core/itinerary/forecast/forecast-stops";
import { shortPlace } from "@floc/core/itinerary/names/place-name";
import type { DailyForecast, HourlyPoint, TripForecast } from "@/server/itinerary/weather";

const label = "font-mono text-[11px] uppercase tracking-[0.06em] text-ink-faint";

type PanelProps = {
  days: IsoDate[];
  byDate: Record<IsoDate, DailyForecast>;
  weather: TripForecast;
  selected: IsoDate | null;
  onSelect: (date: IsoDate | null) => void;
};

export function ForecastPanel({ days, byDate, weather, selected, onSelect }: PanelProps) {
  const open = selected && byDate[selected] ? selected : null;
  return (
    <div className="grid">
      <PanelView shown={open === null}>
        <DayList days={days} byDate={byDate} weather={weather} onSelect={onSelect} />
      </PanelView>
      {days.filter((d) => byDate[d]).map((d) => (
        <PanelView key={d} shown={open === d}>
          <DayHours date={d} day={byDate[d]} points={weather.hourly[d] ?? []} back={() => onSelect(null)} />
        </PanelView>
      ))}
    </div>
  );
}

function PanelView({ shown, children }: { shown: boolean; children: ReactNode }) {
  return (
    <div className={cx("[grid-area:1/1]", !shown && "invisible")} aria-hidden={shown ? undefined : true} inert={!shown}>
      {children}
    </div>
  );
}

function DayList({ days, byDate, weather, onSelect }: Omit<PanelProps, "selected">) {
  const nights = days.flatMap((date) => {
    const placeName = weather.nightPlaces[date];
    return placeName ? [{ date, placeName }] : [];
  });
  const stopAt = stopStarts(nights);

  return (
    <div className="p-4">
      <AsideHead title={weather.placeName} meta={<span className="nums font-mono text-[11px] text-ink-soft">To {formatDate(weather.horizonEnd)}</span>} />
      <ul className="mt-2">
        {days.map((d, i) => {
          const w = byDate[d];
          const { weekday, day: n } = dayParts(d);
          const when = <span className="nums font-mono text-ink">{weekday} {n}</span>;
          const ruled = i > 0 && !stopAt.has(d);
          const row = cx("grid w-full items-center gap-2.5 rounded-sm px-2 py-2 text-left text-[13px]", ruled && "border-t border-rule");
          return (
            <Fragment key={d}>
              {stopAt.has(d) ? (
                <li className={cx("px-2 pb-1 pt-2", i > 0 && "border-t border-rule")}>
                  <h4 className="text-[13px] font-medium text-ink [overflow-wrap:anywhere]">{shortPlace(weather.nightPlaces[d])}</h4>
                </li>
              ) : null}
              <li>
                {w ? (
                  <button type="button" onClick={() => onSelect(d)} className={cx(row, "grid-cols-[3.4rem_16px_minmax(0,1fr)_auto] hover:bg-sheet-3")}>
                    {when}
                    <span className="text-ink-soft"><WeatherGlyph condition={w.condition} /></span>
                    <span className="truncate text-ink-soft">{w.label}</span>
                    <span className="nums">
                      {w.hi}°<small className="ml-1 text-[11px] text-ink-faint">{w.lo}°</small>
                    </span>
                  </button>
                ) : (
                  <span className={cx(row, "grid-cols-[3.4rem_minmax(0,1fr)] text-ink-faint")}>
                    {when}
                    <span>{d <= weather.horizonEnd ? "No forecast right now" : "Beyond the forecast"}</span>
                  </span>
                )}
              </li>
            </Fragment>
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
        className="-ml-1 -mt-1 mb-3 inline-flex items-center gap-1 rounded-sm py-1 pl-1 pr-2 text-[13px] text-ink-soft hover:bg-sheet-3 hover:text-ink"
      >
        <ChevronIcon direction="left" />
        All days
      </button>
      <p className={label}>
        {weekday} {n}
      </p>
      <p className="mt-1 text-[13px] font-medium text-ink [overflow-wrap:anywhere]">{shortPlace(day.placeName)}</p>
      <div className="mb-3 mt-1.5 flex items-center gap-3">
        <span className="text-ink-soft">
          <WeatherGlyph condition={day.condition} size={30} />
        </span>
        <b className="nums font-display text-[39px] font-semibold leading-none tracking-[-0.02em]">{day.hi}°</b>
        <span className="text-[13px] leading-snug text-ink-soft">
          {day.label}
          <br />
          Low {day.lo}°
        </span>
      </div>
      <ol>
        {points.map((h) => (
          <li
            key={h.hour}
            className="grid grid-cols-[3.4rem_16px_minmax(0,1fr)_auto] items-center gap-2.5 border-t border-rule px-0.5 py-2 text-[13px]"
          >
            <span className="nums font-mono text-ink-soft">{h.hour}</span>
            <span className="text-ink-soft"><WeatherGlyph condition={h.condition} /></span>
            <b className="nums font-medium">{h.temp}°</b>
            <span className="nums font-mono text-[11px] text-pen" aria-label={h.rain ? `${h.rain} mm of rain` : undefined}>{h.rain ? `${h.rain} mm` : ""}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
