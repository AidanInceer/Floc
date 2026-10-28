import Link from "next/link";

import { dayParts } from "@floc/core/dates/dates";
import type { DayEventRow } from "@/server/itinerary/itinerary";
import { ChevronIcon } from "@/components/system/icons";
import { dayHref } from "@/lib/trip-links";
import { KindTile } from "./stop-parts";

const label = (e: DayEventRow) => e.title ?? e.placeName ?? "Untitled";

// Why: a <details> row — a day opens without client JS, and several can stay open at once.
export function StopDay({ tripId, date, events }: { tripId: number; date: string; events: DayEventRow[] }) {
  const { weekday, day } = dayParts(date);
  const [first] = events;
  return (
    <li className="border-t border-rule">
      <details className="group/day my-0.5 rounded-sm open:bg-paper">
        <summary className="grid cursor-pointer list-none grid-cols-[32px_26px_minmax(0,1fr)_auto_14px] items-center gap-3 rounded-sm px-1.5 py-2 hover:bg-paper [&::-webkit-details-marker]:hidden">
          <span className="nums grid size-8 place-content-center rounded-sm bg-sheet-2 text-center text-[13px] leading-none text-ink-soft group-open/day:bg-ink group-open/day:text-sheet">
            <span className="mb-0.5 text-[7px] uppercase tracking-[0.08em]">{weekday}</span>
            {day}
          </span>
          {first ? (
            <KindTile type={first.type} transportType={first.transportType} />
          ) : (
            <span className="size-[26px] rounded-sm border-[1.5px] border-dashed border-rule-strong" />
          )}
          {first ? (
            <span className="truncate text-sm text-ink">{label(first)}</span>
          ) : (
            <span className="truncate text-sm italic text-ink-faint">Nothing planned</span>
          )}
          <span className="nums text-xs text-ink-faint">{events.length > 1 ? `+${events.length - 1}` : ""}</span>
          <ChevronIcon direction="down" size={14} className="text-ink-faint transition-transform group-open/day:rotate-180" />
        </summary>
        {events.length > 0 ? (
          <ol className="relative grid pb-1 pl-2 pr-4 before:absolute before:bottom-[19px] before:left-[calc(0.5rem+44px+12px+12px)] before:top-[19px] before:w-0.5 before:rounded-full before:bg-rule-strong sm:pl-[50px] sm:before:left-[calc(50px+44px+12px+12px)]">
            {events.map((e) => (
              <li key={e.id} className="grid grid-cols-[44px_26px_minmax(0,1fr)] items-center gap-3 py-1.5 text-sm">
                <span className="nums text-right text-xs text-ink-faint">{e.time ?? "All day"}</span>
                <KindTile type={e.type} transportType={e.transportType} />
                <span className="min-w-0">{label(e)}</span>
              </li>
            ))}
          </ol>
        ) : null}
        <Link href={dayHref(tripId, date)} className="mb-2.5 ml-2 inline-flex items-center gap-1.5 text-sm text-pen hover:underline sm:ml-[50px]">
          {events.length > 0 ? "Open on Days" : "Plan it on Days"} &rarr;
        </Link>
      </details>
    </li>
  );
}
