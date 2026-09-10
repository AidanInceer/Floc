"use client";

/**
 * One day in the availability grid (ticket 243, split from `availability-calendar`).
 * Four looks over the same square — paint your own days, read the group's
 * agreement, pick the trip window, or read the weather — one cell per view so
 * no single one carries every branch.
 */
import { cx } from "@/components/ui";
import { WeatherGlyph } from "@/components/weather-glyph";
import type { WeatherCondition } from "@floc/core/weather";
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

// Shared cell chrome: one rule under the week, no box around the day (ticket 129).
const CELL =
  "relative flex aspect-square flex-col items-center justify-center border-b border-ink/10 font-mono text-[11px] leading-none";

// Focus ring on the mark, not the cell (ticket 129): the square cell outline
// drew a blue box around the round mark.
const FOCUS_RING =
  "group-focus-visible:ring-2 group-focus-visible:ring-pen group-focus-visible:ring-offset-1 group-focus-visible:ring-offset-sheet";

// Three states, not a ramp (ticket 67): either the whole group is free (green)
// or the day costs somebody (red); no answer yet is the plain sheet, not a bad
// answer. Exact count rides on `title`/aria, not a number under the mark.
function groupMark(tally: number, memberCount: number): string {
  return tally === 0
    ? "text-ink-faint"
    : tally === memberCount
      ? "bg-green-soft text-green"
      : "bg-red-soft text-red";
}

export function DayCell(props: DayCellProps) {
  if (props.view === "weather") return <WeatherCell {...props} />;
  if (props.view === "everyone") return <EveryoneCell {...props} />;
  return <PaintCell {...props} />;
}

// Disc wash per condition (ticket 148): sun is the highlighter, rain the biro
// wash; part/cloud share the neutral sheet, told apart by glyph and word.
const DISC_TINT: Record<WeatherCondition, string> = {
  sun: "bg-highlight-soft",
  part: "bg-sheet-3",
  cloud: "bg-sheet-3",
  rain: "bg-pen-soft",
};

// Weather (ticket 148): the disc is the condition, day number in the corner, so
// a run of sun reads as a shape. Inside the horizon a day opens its hourly
// drawer; past it, a non-interactive dashed ring (no drawer onto no data).
function WeatherCell({
  date,
  past,
  inTrip,
  isToday,
  weather,
  weatherOpen,
  onToggle,
}: DayCellProps) {
  const dayNumber = Number(date.slice(8, 10));
  const corner = (
    <span
      aria-hidden
      className="absolute left-1 top-0.5 font-mono text-[9px] leading-none text-ink-faint"
    >
      {dayNumber}
    </span>
  );
  const discBase =
    "flex h-[70%] w-[70%] items-center justify-center rounded-full transition-colors";
  const windowRing = inTrip || isToday ? "ring-1 ring-pen" : "";

  // Outside the window: no weather at all, not even a dashed ring (ticket 148).
  if (!inTrip) {
    return (
      <span role="gridcell" data-date={date} className={cx(CELL, "opacity-70")}>
        {corner}
      </span>
    );
  }

  if (!weather) {
    return (
      <span
        role="gridcell"
        data-date={date}
        title={`${date} — beyond the forecast`}
        className={cx(CELL, past && "opacity-70")}
      >
        {corner}
        <span
          aria-hidden
          className={cx(discBase, "border border-dashed border-rule-strong", windowRing)}
        />
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
      className={cx(CELL, "group transition-colors focus-visible:outline-none", past && "opacity-70")}
    >
      {corner}
      <span
        className={cx(
          discBase,
          FOCUS_RING,
          DISC_TINT[weather.condition],
          weather.condition === "rain" ? "text-pen" : "text-ink-soft",
          windowRing,
          // Hover previews the open day's pen ring, so it reads without the cursor.
          "group-hover:ring-2 group-hover:ring-pen",
          weatherOpen && "ring-2 ring-pen",
        )}
      >
        <WeatherGlyph condition={weather.condition} size={20} />
      </span>
    </button>
  );
}

// Read-only agreement wash for the whole group (ticket 67).
function EveryoneCell({ date, tally, memberCount, past, inTrip }: DayCellProps) {
  return (
    <span
      role="gridcell"
      title={`${date} — ${tally} of ${memberCount} free`}
      className={cx(CELL, past && "opacity-70")}
    >
      <span
        className={cx(
          "flex h-[70%] w-[70%] items-center justify-center rounded-full",
          inTrip ? "bg-green font-semibold text-sheet" : groupMark(tally, memberCount),
        )}
      >
        {Number(date.slice(8, 10))}
      </span>
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

// The mark's wash: the group's answer while picking, your own blue while
// painting; the classes are pulled out so the cell itself stays flat.
function paintMarkClass(p: DayCellProps, picking: boolean): string {
  return cx(
    "flex h-[70%] w-[70%] items-center justify-center rounded-full transition-colors",
    FOCUS_RING,
    // Picking: the group's answer, chosen days pressed into solid green.
    picking && (p.inRange ? "bg-green font-semibold text-sheet" : groupMark(p.tally, p.memberCount)),
    // The span you'd get by clicking here: solid green at half strength (ticket 135).
    picking && p.pending && "bg-green/45 font-semibold text-sheet",
    // Start with no end: ringed, else a lone solid day read as a one-day trip.
    picking && p.openEnd && "ring-2 ring-pen ring-offset-1 ring-offset-sheet",
    // Blue, because a day you marked is your own answer (ticket 197) — green is
    // reserved for the run the whole group can do.
    !picking && p.free && "bg-pen-soft font-semibold text-pen-deep ring-1 ring-pen",
    !picking && !p.free && "text-ink-soft",
    p.isToday && !p.free && !p.inRange && "ring-1 ring-pen", // today circled
  );
}

// Two things one cell shows (ticket 128): painting availability it's on/off;
// picking the window it shows the group's washes, since choosing a week is a
// decision about who can make it. An in-window day overrides with solid green.
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
      className={cx(CELL, "group transition-colors focus-visible:outline-none", p.past && "opacity-70")}
    >
      <span className={paintMarkClass(p, picking)}>{Number(p.date.slice(8, 10))}</span>
    </button>
  );
}
