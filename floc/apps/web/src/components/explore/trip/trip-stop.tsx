import type { PlanArrival, PlanDay, PlanStop } from "@floc/core/trip/explore/detail/preset-plan";

import type { RegionTone } from "@/components/explore/trip/region-tone";
import { DayRow } from "@/components/explore/trip/trip-day";
import { TravelModeIcon } from "@/components/map/travel-mode-icon";
import { cx } from "@/components/system/ui";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

function arrivalLine(a: PlanArrival): string {
  const how = a.mode === "other" ? a.detail : `${a.mode[0].toUpperCase()}${a.mode.slice(1)}, ${a.detail}`;
  return `${how} from ${a.from}${a.via ? `, by ${a.via}` : ""}`;
}

export function Arrival({ arrive }: { arrive: PlanArrival }) {
  return (
    <p className="ml-7 flex min-h-[34px] items-center gap-2 border-l-[1.5px] border-dashed border-rule-strong pl-3.5 font-mono text-xs text-ink-faint">
      <TravelModeIcon mode={arrive.mode} />
      {arrivalLine(arrive)}
    </p>
  );
}

function dayRange(days: PlanDay[]): string {
  if (days.length === 0) return "";
  const first = days[0].n;
  const last = days[days.length - 1].n;
  return first === last ? ` · Day ${first}` : ` · Days ${first} to ${last}`;
}

export function StopPanel({
  stop,
  isOpen,
  onToggle,
  tone,
}: {
  stop: PlanStop;
  isOpen: (day: number) => boolean;
  onToggle: (day: number) => void;
  tone: RegionTone;
}) {
  return (
    <section id={`stop-${stop.no}`} className="scroll-mt-4 rounded-md border border-rule-strong bg-sheet px-3 pb-3 pt-4 sm:px-[18px] sm:pb-[18px]">
      <header className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1 sm:grid-cols-[auto_auto_minmax(0,1fr)]">
        <span className={cx("nums grid size-[26px] place-items-center rounded-full border text-xs", tone.mark)}>{stop.no}</span>
        <h3 className="text-xl tracking-[-0.02em] sm:text-[length:var(--text-2xl)]">{stop.place}</h3>
        <span className="typed col-start-2 sm:col-start-3">
          {plural(stop.nights, "night")}
          {dayRange(stop.days)}
        </span>
      </header>
      <div className="grid gap-1.5 pb-1 pl-[38px] pt-1">
        {stop.summary ? <p className="text-sm text-ink-soft">{stop.summary}</p> : null}
        {stop.sideTrips.map((trip) => (
          <p key={trip} className="text-sm text-ink-soft">
            {trip}
          </p>
        ))}
      </div>
      {stop.days.length > 0 ? (
        <ol className="mt-3 grid gap-1.5">
          {stop.days.map((day) => (
            <DayRow key={day.n} day={day} open={isOpen(day.n)} onToggle={() => onToggle(day.n)} />
          ))}
        </ol>
      ) : null}
    </section>
  );
}
