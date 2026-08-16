/**
 * Overview's forecast register (ticket 148) — borderless rows on the page's own
 * ruled sheet (a card would be a box inside a box). Three deliberate silences
 * (rule 11 / rule 9): null forecast, trip entirely beyond the horizon → nothing
 * at all; trip running past the horizon → a dashed edge, never a guess.
 */
import type { IsoDate } from "@/lib/dates";
import type { TripForecast as TripForecastData } from "@/server/weather";
import { formatDate } from "@/lib/dates";
import { WeatherGlyph } from "@/components/weather-glyph";
import { cx } from "@/components/ui";

export function TripForecast({
  forecast,
  tripStart,
  tripEnd,
}: {
  forecast: TripForecastData | null;
  tripStart: IsoDate | null;
  tripEnd: IsoDate | null;
}) {
  // Guards a forecast passed without a window; undated trips never get here.
  if (!forecast || !tripStart || !tripEnd) return null;

  const rows = forecast.days.filter(
    (d) => d.date >= tripStart && d.date <= tripEnd,
  );
  if (rows.length === 0) return null;

  const lastShown = rows[rows.length - 1].date;
  const truncated = tripEnd > lastShown; // trip outruns the forecast

  return (
    <section className="mt-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[15px] font-semibold">Forecast</h2>
        <span className="typed">Open-Meteo · {forecast.placeName}</span>
      </div>

      <div className="mt-2 border-t border-rule">
        {rows.map((d) => {
          const wet = d.condition === "rain";
          return (
            <div
              key={d.date}
              className={cx(
                "grid grid-cols-[6.5rem_1.5rem_1fr_auto] items-center gap-3 border-b border-rule px-2 py-2 transition-colors",
                wet ? "bg-pen-soft" : "hover:bg-sheet-2",
              )}
            >
              <span className="nums text-[12px] text-ink-soft">
                {formatDate(d.date)}
              </span>
              <span className={cx(wet ? "text-pen" : "text-ink-soft")}>
                <WeatherGlyph condition={d.condition} size={21} />
              </span>
              <span className={cx("text-sm", wet ? "text-pen" : "text-ink-soft")}>
                {d.label}
              </span>
              <span className="nums whitespace-nowrap text-right">
                <span className="text-[13px] text-ink">{d.hi}°</span>{" "}
                <span className="text-[11px] text-ink-faint">{d.lo}°</span>
              </span>
            </div>
          );
        })}
      </div>

      {/* Dashed rule: the data stops here, no invented rows past it. */}
      {truncated ? (
        <div className="mt-2 flex items-center gap-2.5 px-2">
          <span
            aria-hidden="true"
            className="h-0 flex-1 border-t border-dashed border-rule-strong"
          />
          <span className="typed">Forecast reaches {formatDate(lastShown)}</span>
          <span
            aria-hidden="true"
            className="h-0 flex-1 border-t border-dashed border-rule-strong"
          />
        </div>
      ) : null}
    </section>
  );
}
