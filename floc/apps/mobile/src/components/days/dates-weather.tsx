/** The Dates screen's Weather view, kept out of the screen so the screen stays readable. */
import type { TripForecastView } from "@floc/api/port";

import { WeatherLocked, WeatherPanel, type ForecastDay } from "./weather-panel";

export type ForecastIndex = {
  /** Offered with a forecast, or when Pro is the only thing missing (#248). */
  offered: boolean;
  byDate: Record<string, ForecastDay>;
};

export function forecastIndex(view: TripForecastView | undefined): ForecastIndex {
  const byDate: Record<string, ForecastDay> = {};
  for (const day of view?.forecast?.days ?? []) byDate[day.date] = day;
  return { offered: !!view && (view.locked || view.forecast !== null), byDate };
}

export function DatesWeather({
  view,
  byDate,
  openDay,
  onSeePro,
}: {
  view: TripForecastView | undefined;
  byDate: Record<string, ForecastDay>;
  openDay: string | null;
  onSeePro: () => void;
}) {
  if (view?.locked) return <WeatherLocked onSeePro={onSeePro} />;
  const forecast = view?.forecast;
  if (!forecast) return null;

  return (
    <WeatherPanel
      placeName={forecast.placeName}
      horizonEnd={forecast.horizonEnd}
      day={openDay ? (byDate[openDay] ?? null) : null}
      hours={openDay ? (forecast.hourly[openDay] ?? []) : []}
    />
  );
}
