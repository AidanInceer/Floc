"use client";

/**
 * The Weather view's two readers (ticket 148, split out under ticket 243): the
 * reading line under the grid, and the hourly curve drawer for one day. Both
 * are shape-first — the run of discs and the temperature line carry the sense;
 * exact figures ride on `title`/aria.
 */
import { cx } from "@/components/system/ui";
import { WeatherGlyph } from "@/components/system/weather-glyph";
import { formatDate, type IsoDate } from "@floc/core/dates";
import type { DailyForecast, HourlyPoint } from "@/server/itinerary/weather";

// Reading line under the weather calendar: temperatures for the hovered day; at
// rest it names the place and horizon, so the row is never empty.
export function WeatherReadout({
  hover,
  byDate,
  placeName,
  horizonEnd,
}: {
  hover: string | null;
  byDate: Record<IsoDate, DailyForecast>;
  placeName: string;
  horizonEnd: IsoDate;
}) {
  const wx = hover ? byDate[hover] : undefined;

  if (hover && wx) {
    return (
      <div className="flex w-full items-center gap-3">
        <span className={cx(wx.condition === "rain" ? "text-pen" : "text-ink-soft")}>
          <WeatherGlyph condition={wx.condition} size={22} />
        </span>
        <span className="nums text-[12px] text-ink-soft">{formatDate(hover)}</span>
        <span className="text-sm text-ink">{wx.label}</span>
        <span className="nums ml-auto whitespace-nowrap">
          <span className="text-[15px] text-ink">{wx.hi}°</span>{" "}
          <span className="text-[12px] text-ink-faint">{wx.lo}°</span>
        </span>
      </div>
    );
  }

  if (hover) {
    return (
      <div className="flex w-full items-center gap-3">
        <span className="nums text-[12px] text-ink-soft">{formatDate(hover)}</span>
        <span className="text-sm text-ink-faint">Beyond the forecast</span>
      </div>
    );
  }

  return (
    <div className="flex w-full items-center">
      <span className="typed">
        {placeName} · to {formatDate(horizonEnd)}
      </span>
    </div>
  );
}

// Hourly forecast for one day (ticket 148, prototype C2): a temperature curve,
// not a table — the shape is the point. Exact figures ride on each `title`.
// Fixed 700×132 viewBox scaled by width, ratio kept, so geometry is arithmetic.
export function HourlyCurve({
  date,
  day,
  points,
  onClose,
}: {
  date: IsoDate;
  day?: DailyForecast;
  points: HourlyPoint[];
  onClose: () => void;
}) {
  return (
    <div className="px-3 py-2.5">
      <div className="mb-1.5 flex items-center gap-2.5">
        <span className="nums text-[12px] text-ink">{formatDate(date)}</span>
        {day ? <span className="text-[13px] text-ink-soft">{day.label}</span> : null}
        {day ? (
          <span className="nums ml-auto text-[12px] text-ink-soft">
            {day.hi}° / {day.lo}°
          </span>
        ) : (
          <span className="ml-auto" />
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close hourly forecast"
          className="grid place-items-center rounded-sm border border-rule-strong p-1 text-ink-faint transition-colors hover:border-pen hover:text-pen"
        >
          <svg
            viewBox="0 0 24 24"
            width="12"
            height="12"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.7}
            strokeLinecap="round"
            aria-hidden
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      {points.length > 1 ? <HourlyChart date={date} points={points} /> : null}

      <div className="mt-1 flex items-center gap-4 text-[11px] text-ink-soft">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="h-0.5 w-4 rounded-full bg-pen" />
          Temperature
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="h-2.5 w-3 rounded-sm bg-pen opacity-40" />
          Chance of rain
        </span>
      </div>
    </div>
  );
}

// The curve itself: fixed 700×132 viewBox scaled by width, ratio kept, so all
// the geometry is arithmetic off the point index.
function HourlyChart({ date, points }: { date: IsoDate; points: HourlyPoint[] }) {
  const W = 700;
  const H = 132;
  const padL = 26;
  const padR = 26;
  const top = 34;
  const base = 96;
  const rainY = H - 18;

  const temps = points.map((p) => p.temp);
  const lo = temps.length ? Math.min(...temps) : 0;
  const hi = temps.length ? Math.max(...temps) : 1;
  const span = Math.max(hi - lo, 1);
  const x = (i: number) => padL + i * ((W - padL - padR) / (points.length - 1));
  const y = (t: number) => top + (1 - (t - lo) / span) * (base - top);
  const line = points
    .map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p.temp).toFixed(1)}`)
    .join(" ");

  return (
    <div className="relative">
      {/* Glyphs only where the condition changes — all eight hid the curve. */}
      {points.map((p, i) =>
        i > 0 && points[i - 1].condition === p.condition ? null : (
          <span
            key={`g-${p.hour}`}
            className={cx(
              "absolute top-0 -translate-x-1/2",
              p.condition === "rain" ? "text-pen" : "text-ink-soft",
            )}
            style={{ left: `${(x(i) / W) * 100}%` }}
          >
            <WeatherGlyph condition={p.condition} size={17} />
          </span>
        ),
      )}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block h-auto w-full"
        role="img"
        aria-label={`Hourly temperature for ${formatDate(date)}`}
      >
        <line x1={padL} y1={rainY} x2={W - padR} y2={rainY} className="stroke-rule" strokeWidth={1} />
        {points.map((p, i) =>
          p.pop > 0 ? (
            <rect
              key={`r-${p.hour}`}
              x={x(i) - 13}
              y={rainY - (3 + (p.pop / 100) * 15)}
              width={26}
              height={3 + (p.pop / 100) * 15}
              rx={1.5}
              className="fill-pen opacity-40"
            >
              <title>{`${p.hour} — ${p.pop}% chance of rain`}</title>
            </rect>
          ) : null,
        )}
        <path
          d={line}
          className="fill-none stroke-pen"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((p, i) => (
          <g key={`p-${p.hour}`}>
            <circle cx={x(i)} cy={y(p.temp)} r={3.4} className="fill-sheet-2 stroke-pen" strokeWidth={1.6}>
              <title>{`${p.hour} — ${p.temp}°${p.pop > 0 ? `, ${p.pop}% rain` : ""}`}</title>
            </circle>
            <text x={x(i)} y={y(p.temp) - 9} textAnchor="middle" className="fill-ink font-mono" fontSize={10}>
              {p.temp}°
            </text>
            <text x={x(i)} y={H - 4} textAnchor="middle" className="fill-ink-faint font-mono" fontSize={9}>
              {p.hour}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
