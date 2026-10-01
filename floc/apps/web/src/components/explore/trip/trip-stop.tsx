import type { PlanArrival, PlanDay, PlanStop } from "@floc/core/trip/explore/detail/preset-plan";

import type { RegionTone } from "@/components/explore/trip/region-tone";
import { StarIcon } from "@/components/explore/trip/trip-glyphs";
import { TravelModeIcon } from "@/components/map/travel-mode-icon";
import { ChevronIcon } from "@/components/system/icons";
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

function DayCard({ day, isNow, tone }: { day: PlanDay; isNow: boolean; tone: RegionTone }) {
  return (
    <article className={cx("rounded-md border bg-sheet-2 px-4 py-3.5", isNow ? cx(tone.now, "shadow-raised") : "border-rule-strong")}>
      <header className="flex items-baseline gap-3">
        <span className="typed whitespace-nowrap">Day {day.n}</span>
        <h4 className="text-md tracking-[-0.01em]">{day.title}</h4>
      </header>
      <ul className="mt-2.5 grid gap-1.5">
        {day.items.map((item) => (
          <li key={`${item.time}-${item.text}`} className="grid grid-cols-[3rem_1fr] gap-2.5 text-sm text-ink-soft">
            <span className="nums pt-px text-xs text-ink-faint">{item.time}</span>
            <span className={item.free ? "italic text-green" : undefined}>{item.text}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function StopDays({ stop, now, onPick, tone }: { stop: PlanStop; now: number; onPick: (day: number) => void; tone: RegionTone }) {
  return (
    <ol className={cx("relative grid gap-2.5 pb-4 pl-7 before:absolute before:bottom-10 before:left-[9px] before:top-2 before:border-l-[1.5px] before:border-dashed", tone.rail)}>
      {stop.days.map((day) => {
        const isNow = day.n === now;
        return (
          <li key={day.n} id={`day-${day.n}`} data-day={day.n} className="relative scroll-mt-28">
            <button
              type="button"
              onClick={() => onPick(day.n)}
              aria-label={`Mark day ${day.n}`}
              aria-pressed={isNow}
              className={cx(
                "absolute -left-[24px] top-5 size-[11px] rounded-full border-[1.5px] transition-transform after:absolute after:-inset-2.5 hover:scale-125",
                isNow ? cx(tone.mark, tone.ring, "scale-125 ring-[1.5px] ring-offset-[3px] ring-offset-sheet") : cx(tone.edge, "bg-sheet"),
              )}
            />
            {day.highlight ? (
              <p className="mb-1.5 ml-0.5 flex items-center gap-1.5 text-[12.5px] text-highlight-ink">
                <StarIcon />
                <b className="font-mono text-[11px] font-medium uppercase tracking-[0.06em]">Highlight</b>
                {day.highlight}
              </p>
            ) : null}
            <DayCard day={day} isNow={isNow} tone={tone} />
          </li>
        );
      })}
    </ol>
  );
}

export function StopPanel({
  stop,
  open,
  onToggle,
  now,
  onPick,
  tone,
}: {
  stop: PlanStop;
  open: boolean;
  onToggle: () => void;
  now: number;
  onPick: (day: number) => void;
  tone: RegionTone;
}) {
  const foldable = stop.days.length > 0;
  const head = (
    <>
      <span className={cx("nums grid size-[26px] place-items-center rounded-full border bg-sheet text-xs", tone.edge, tone.ink)}>{stop.no}</span>
      <h3 className="text-xl tracking-[-0.02em] sm:text-[length:var(--text-2xl)]">{stop.place}</h3>
      <span className="typed col-span-2 col-start-2 row-start-2 sm:col-span-1 sm:col-start-3 sm:row-start-1">
        {plural(stop.nights, "night")}
        {dayRange(stop.days)}
      </span>
      {foldable ? <ChevronIcon direction={open ? "up" : "down"} size={16} className="col-start-3 row-start-1 text-ink-faint sm:col-start-4" /> : null}
    </>
  );
  const headGrid = "grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 pt-4 text-left sm:grid-cols-[auto_auto_minmax(0,1fr)_auto]";
  return (
    <section id={`stop-${stop.no}`} className="scroll-mt-4 rounded-lg border border-rule-strong bg-sheet px-3 sm:px-[18px]">
      {foldable ? (
        <button type="button" onClick={onToggle} aria-expanded={open} aria-controls={`stop-${stop.no}-days`} className={headGrid}>
          {head}
        </button>
      ) : (
        <div className={headGrid}>{head}</div>
      )}
      <div className="grid gap-1.5 pb-4 pl-[38px] pt-1">
        {stop.summary ? <p className="text-sm text-ink-soft">{stop.summary}</p> : null}
        {stop.sideTrips.map((trip) => (
          <p key={trip} className="text-sm text-ink-soft">
            {trip}
          </p>
        ))}
        {stop.highlights.length > 0 ? (
          <ul className="mt-0.5 flex flex-wrap gap-1.5">
            {stop.highlights.map((h) => (
              <li key={h} className="inline-flex items-center gap-1.5 rounded-full border border-highlight-edge bg-highlight-soft px-2.5 py-0.5 text-[12.5px] text-highlight-ink">
                <StarIcon />
                {h}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {foldable && open ? (
        <div id={`stop-${stop.no}-days`}>
          <StopDays stop={stop} now={now} onPick={onPick} tone={tone} />
        </div>
      ) : null}
    </section>
  );
}
