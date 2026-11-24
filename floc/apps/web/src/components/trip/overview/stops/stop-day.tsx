import Link from "next/link";
import { Fragment } from "react";

import { dayParts } from "@floc/core/dates/dates";
import type { DayEventRow } from "@/server/itinerary/itinerary";
import { ChevronIcon } from "@/components/system/icons";
import { NavGlyph } from "@/components/system/icons/nav";
import { cx, pressArea } from "@/components/system/ui";
import { dayHref } from "@/lib/trip-links";
import { KindTile } from "./stop-parts";
import { eventName } from "@floc/core/itinerary/names/event-name";
import { ChangeWords } from "@/components/notifications/change-words";
import type { PlanNote } from "@/server/notifications/plan-note";
import { ChangeNote } from "./change-note";

function ChangedEvent({ note, name }: { note: PlanNote; name: string }) {
  const { was } = note.words;
  return (
    <span className="min-w-0">
      <span className="block">{name}</span>
      <span className="mt-0.5 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-highlight px-2 font-mono text-xs text-(--highlight-ink)">{note.kind === "event_added" ? "New" : "Moved"}</span>
        {was ? <ChangeWords words={{ was, now: null }} /> : null}
      </span>
    </span>
  );
}

export function StopDay({ tripId, date, events, note }: { tripId: number; date: string; events: DayEventRow[]; note?: PlanNote | null }) {
  const { weekday, day } = dayParts(date);
  const here = note?.change.date === date ? note : null;
  const changedId = here && here.kind !== "event_removed" ? here.change.eventId : null;
  const onRow = events.some((e) => e.id === changedId);
  const [first] = events;
  const verb = events.length > 0 ? "Open on" : "Plan it on";
  return (
    <li className="border-t border-rule">
      <details open={here ? true : undefined} className="grow-open group/day relative my-0.5 rounded-sm open:bg-paper open:before:pointer-events-none open:before:absolute open:before:inset-y-2 open:before:left-1.5 open:before:z-[1] open:before:w-8 open:before:rounded-sm open:before:bg-sheet-3 open:before:content-['']">
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
        <div className={cx("flex items-end justify-between gap-3 pb-2.5 pl-[50px] pr-4 max-sm:pr-2", here && "max-sm:flex-col max-sm:items-stretch")}>
          {events.length > 0 ? (
            <ol className="relative grid min-w-0 flex-1 pb-1 pt-0.5 before:absolute before:bottom-[19px] before:left-[68px] before:top-[19px] before:w-0.5 before:rounded-full before:bg-rule-strong">
              {events.map((e) => (
                <Fragment key={e.id}>
                  <li
                    className={cx(
                      "grid grid-cols-[44px_26px_minmax(0,1fr)] items-center gap-3 py-1.5 text-sm",
                      e.id === changedId && "relative rounded-sm bg-(--highlight-2) pr-2 ring-[1.5px] ring-pen/60",
                    )}
                  >
                    <span className="nums text-right text-xs text-ink-faint">{e.time ?? "All day"}</span>
                    <KindTile type={e.type} transportType={e.transportType} />
                    {e.id === changedId && here ? <ChangedEvent note={here} name={eventName(e)} /> : <span className="min-w-0">{eventName(e)}</span>}
                  </li>
                  {e.id === changedId && here ? (
                    <li className="relative">
                      <ChangeNote tripId={tripId} note={here} onRow />
                    </li>
                  ) : null}
                </Fragment>
              ))}
            </ol>
          ) : (
            <span aria-hidden className="pb-1 text-sm text-ink-faint">Nothing planned</span>
          )}
          <Link
            href={dayHref(tripId, date)}
            aria-label={`${verb} Days, ${weekday} ${day}`}
            className={cx(pressArea, here && "max-sm:self-end", "mb-1.5 inline-flex h-[26px] shrink-0 items-center gap-1.5 rounded-sm border border-rule-strong bg-sheet px-2.5 text-sm text-ink transition-colors hover:border-pen hover:bg-pen-soft hover:text-pen-deep")}
          >
            <NavGlyph name="days" />
            <span>
              <span className="max-sm:hidden">{verb} </span>Days
            </span>
          </Link>
        </div>
        {here && !onRow ? (
          <div className="pb-1.5 pl-[50px] pr-4 max-sm:pr-2">
            <ChangeNote tripId={tripId} note={here} onRow={false} />
          </div>
        ) : null}
      </details>
    </li>
  );
}
