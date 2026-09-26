"use client";

/**
 * One day in the availability grid (ticket 243, split from `availability-calendar`).
 * Four looks over the same square — paint your own days, read the group's
 * agreement, pick the trip window, or read the weather — one cell per view so
 * no single one carries every branch.
 */
import { cx } from "@/components/system/ui";
import { WeatherGlyph } from "@/components/system/weather-glyph";
import type { WeatherCondition } from "@floc/core/itinerary/weather";
import type { DailyForecast } from "@/server/itinerary/weather";

export type View = "mine" | "everyone" | "dates" | "weather";

export type DayCellProps = {
  date: string;
  view: View;
  free: boolean;
  tally: number;
  memberCount: number;
  past: boolean;
  inTrip: boolean;
  inRange: boolean; // inside the window being picked (dates view)
  isToday: boolean;
  pending?: boolean; // inside the span the pointer proposes (ticket 135)
  openEnd?: boolean; // picked start with no end yet
  weather?: DailyForecast; // undefined past the horizon
  weatherOpen?: boolean;
  onStart: (e: React.PointerEvent) => void;
  onToggle: () => void;
};

// Filled tiles, drawn like the app's month grid.
const CELL =
  "relative flex h-11 flex-col items-center justify-center rounded-sm font-mono text-[13px] leading-none transition-colors";

const TRIP_RING = "inset-ring-[1.5px] inset-ring-pen";

// Three states, not a ramp (ticket 67): the whole group free, some free, or no
// answer — which is the plain sheet, not a bad answer. Butter and mint, as the app.
function groupMark(tally: number, memberCount: number): string {
  return tally === 0
    ? "text-ink-soft"
    : tally === memberCount
      ? "bg-pastel-green text-pastel-green-ink"
      : "bg-pastel-red text-pastel-red-ink";
}

export function DayCell(props: DayCellProps) {
  if (props.view === "weather") return <WeatherCell {...props} />;
  if (props.view === "everyone") return <EveryoneCell {...props} />;
  return <PaintCell {...props} />;
}

// Tile wash per condition (ticket 148): sun is the highlighter, rain the biro
// wash; part/cloud share the neutral sheet, told apart by glyph and word.
const WEATHER_TINT: Record<WeatherCondition, string> = {
  sun: "bg-highlight-soft text-highlight-ink",
  part: "bg-sheet-3 text-ink-soft",
  cloud: "bg-sheet-3 text-ink-soft",
  rain: "bg-pen-soft text-pen",
};

// Weather (ticket 148): the same tile as the other views, washed by condition
// with its glyph under the day. Inside the horizon a day opens its hourly
// drawer; past it, a dashed tile (no drawer onto no data).
function WeatherCell({
  date,
  past,
  inTrip,
  weather,
  weatherOpen,
  onToggle,
}: DayCellProps) {
  const day = Number(date.slice(8, 10));

  // Outside the window: no weather at all (ticket 148).
  if (!inTrip) {
    return (
      <span role="gridcell" data-date={date} className={cx(CELL, "text-ink-faint opacity-70")}>
        {day}
      </span>
    );
  }

  if (!weather) {
    return (
      <span
        role="gridcell"
        data-date={date}
        title={`${date} — beyond the forecast`}
        className={cx(CELL, "border border-dashed border-rule-strong text-ink-soft", past && "opacity-70")}
      >
        {day}
      </span>
    );
  }

  return (
    <button
      type="button"
      role="gridcell"
      data-date={date}
      aria-expanded={weatherOpen}
      aria-label={`${date} — ${weather.label}, high ${weather.hi}°, low ${weather.lo}°`}
      title={`${date} — ${weather.label}, ${weather.hi}° / ${weather.lo}°`}
      onClick={onToggle}
      className={cx(
        CELL,
        "gap-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pen",
        WEATHER_TINT[weather.condition],
        weatherOpen ? "inset-ring-2 inset-ring-pen" : cx(TRIP_RING, "hover:inset-ring-2"),
        past && "opacity-70",
      )}
    >
      {day}
      <WeatherGlyph condition={weather.condition} size={14} />
    </button>
  );
}

// Read-only agreement for the whole group (ticket 67). Shaded and counted, so
// the wash is never the only thing saying it (#204).
function EveryoneCell({ date, tally, memberCount, past, inTrip }: DayCellProps) {
  return (
    <span
      role="gridcell"
      title={`${date} — ${tally} of ${memberCount} free`}
      className={cx(CELL, groupMark(tally, memberCount), inTrip && TRIP_RING, past && "opacity-70")}
    >
      {Number(date.slice(8, 10))}
      {tally > 0 ? <span className="mt-1 text-[9px] opacity-80">{tally}</span> : null}
    </span>
  );
}

function paintLabel(p: DayCellProps, picking: boolean): string {
  if (!picking) return `${p.date}${p.free ? " — you're free" : ""}`;
  const trip = p.inRange ? ", in the trip" : "";
  const start = p.openEnd ? ", start of the window" : "";
  const proposed = p.pending ? ", in the window being picked" : "";
  return `${p.date} — ${p.tally} of ${p.memberCount} free${trip}${start}${proposed}`;
}

// One fill per state, chosen in order: Tailwind can't be trusted to let a later
// `bg-*` beat an earlier one in the same class list.
function paintFill(p: DayCellProps, picking: boolean): string {
  if (!picking) return p.free ? "bg-pastel-blue font-semibold text-pastel-blue-ink" : "text-ink";
  // Start with no end: ringed, else a lone filled day read as a one-day trip.
  if (p.openEnd) return "bg-green font-semibold text-sheet inset-ring-2 inset-ring-pen";
  if (p.inRange) return "bg-green font-semibold text-sheet";
  // The span you'd get by clicking here (ticket 135).
  if (p.pending) return "bg-green/45 font-semibold text-sheet";
  return groupMark(p.tally, p.memberCount);
}

// Two things one cell shows (ticket 128): painting availability it's on/off;
// picking the window it shows the group's washes, since choosing a week is a
// decision about who can make it.
function PaintCell(p: DayCellProps) {
  const picking = p.view === "dates";
  const marked = picking ? p.inRange : p.free;

  return (
    <button
      type="button"
      role="gridcell"
      // `aria-selected`, not `aria-pressed`: a gridcell doesn't support the
      // toggle-button state, so a screen reader was told nothing about whether
      // the day was on (ticket 204). The visible label says it too.
      aria-selected={marked}
      aria-label={paintLabel(p, picking)}
      title={picking ? `${p.date} — ${p.tally} of ${p.memberCount} free` : undefined}
      data-date={p.date} // what the surface hit-tests each move (see startPaint)
      onPointerDown={p.onStart}
      // Keyboard Enter/Space arrive as a click with `detail === 0` and no
      // `pointerdown` — the only way this cell is reachable from the keyboard.
      onClick={(e) => {
        if (e.detail === 0) p.onToggle();
      }}
      className={cx(
        CELL,
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pen",
        paintFill(p, picking),
        p.isToday && !marked && !p.pending && "inset-ring-1 inset-ring-rule-strong",
        p.past && "opacity-70",
      )}
    >
      {Number(p.date.slice(8, 10))}
    </button>
  );
}
