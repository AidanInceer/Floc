import Link from "next/link";

import { dayParts } from "@floc/core/dates/dates";
import type { DayEventRow } from "@/server/itinerary/itinerary";
import { ChevronIcon } from "@/components/system/icons";
import { NavGlyph } from "@/components/system/icons/nav";
import { cx, pressArea } from "@/components/system/ui";
import { dayHref } from "@/lib/trip-links";
import { KindTile } from "./stop-parts";
import { eventName } from "@floc/core/itinerary/names/event-name";


export function StopDay({ tripId, date, events }: { tripId: number; date: string; events: DayEventRow[] }) {
  const { weekday, day } = dayParts(date);
  const [first] = events;
  const verb = events.length > 0 ? "Open on" : "Plan it on";
  return (
    <li className="border-t border-rule">
      <details className="grow-open group/day relative my-0.5 rounded-sm open:bg-paper open:before:pointer-events-none open:before:absolute open:before:inset-y-2 open:before:left-1.5 open:before:z-[1] open:before:w-8 open:before:rounded-sm open:before:bg-sheet-3 open:before:content-['']">
        <summary className="grid cursor-pointer list-none grid-cols-[32px_26px_minmax(0,1fr)_auto_14px] items-center gap-3 rounded-sm px-1.5 py-2 hover:bg-paper [&::-webkit-details-marker]:hidden">
          <span className="nums relative z-[2] grid size-8 place-content-center rounded-sm bg-sheet-2 text-center text-[13px] leading-none text-ink-soft group-open/day:bg-transparent group-open/day:text-ink">
            <span className="mb-0.5 text-[11px] uppercase tracking-[0.08em]">{weekday}</span>
            <span className="group-open/day:font-semibold">{day}</span>
          </span>
          {first ? (
            <KindTile type={first.type} transportType={first.transportType} />
          ) : (
            <span className="size-[26px] rounded-sm border-[1.5px] border-dashed border-rule-strong" />
          )}
          {first ? (
            <span className="truncate text-sm text-ink">{eventName(first)}</span>
          ) : (
            <span className="text-sm text-ink-faint">
              <span aria-hidden>…</span>
              <span className="sr-only">Nothing planned</span>
            </span>
          )}
          <span className="nums text-xs text-ink-faint">{events.length > 1 ? `+${events.length - 1}` : ""}</span>
          <ChevronIcon direction="down" size={14} className="text-ink-faint transition-transform duration-[0.22s] ease-(--ease) group-open/day:rotate-180" />
        </summary>
        <div className="flex items-end justify-between gap-3 pb-2.5 pl-[50px] pr-4 max-sm:pr-2">
          {events.length > 0 ? (
            <ol className="relative grid min-w-0 flex-1 pb-1 before:absolute before:bottom-[19px] before:left-[68px] before:top-[19px] before:w-0.5 before:rounded-full before:bg-rule-strong">
              {events.map((e) => (
                <li key={e.id} className="grid grid-cols-[44px_26px_minmax(0,1fr)] items-center gap-3 py-1.5 text-sm">
                  <span className="nums text-right text-xs text-ink-faint">{e.time ?? "All day"}</span>
                  <KindTile type={e.type} transportType={e.transportType} />
                  <span className="min-w-0">{eventName(e)}</span>
                </li>
              ))}
            </ol>
          ) : (
            <span aria-hidden className="pb-1 text-sm text-ink-faint">Nothing planned</span>
          )}
          <Link
            href={dayHref(tripId, date)}
            aria-label={`${verb} Days, ${weekday} ${day}`}
            className={cx(pressArea, "mb-1.5 inline-flex h-[26px] shrink-0 items-center gap-1.5 rounded-sm border border-rule-strong bg-sheet px-2.5 text-sm text-ink transition-colors hover:border-pen hover:bg-pen-soft hover:text-pen-deep")}
          >
            <NavGlyph name="days" />
            <span>
              <span className="max-sm:hidden">{verb} </span>Days
            </span>
          </Link>
        </div>
      </details>
    </li>
  );
}
