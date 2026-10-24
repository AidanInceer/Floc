// Why: only while the trip runs (#329) — before it, the plan is Days' job; after it, there is no "today".
import Link from "next/link";

import { formatDate } from "@floc/core/dates/dates";
import type { TodayPlan } from "@floc/core/trip/route/today-plan";
import type { DayEventType, TransportType } from "@floc/core/vocabulary";
import { DocCategoryIcon } from "@/components/documents/doc-category-icon";
import { EventGlyph } from "@/components/days/days-glyphs";
import type { DocCategory } from "@floc/core/documents/documents";

type TodayEvent = {
  id: number;
  type: DayEventType;
  transportType: TransportType | null;
  title: string | null;
  time: string | null;
  endTime: string | null;
  placeName: string | null;
};
type TodayFile = { id: number; name: string; category: DocCategory };

export function TodayBlock({ tripId, plan }: { tripId: number; plan: TodayPlan<TodayEvent, TodayFile> }) {
  return (
    <section aria-labelledby="today-heading" className="flex flex-col gap-3 rounded-xl bg-sheet p-5 ring-1 ring-rule">
      <h2 id="today-heading" className="flex items-baseline gap-2 font-display text-lg">
        Today
        <span className="text-sm font-normal text-ink-soft">{formatDate(plan.date)}</span>
      </h2>
      {plan.events.length === 0 ? (
        <p className="text-sm text-ink-soft">
          Nothing planned today.{" "}
          <Link href={`/trip/${tripId}/days?date=${plan.date}`} className="text-pen hover:underline">
            Add to the day
          </Link>
        </p>
      ) : (
        <ol className="divide-y divide-rule">
          {plan.events.map((e) => (
            <li key={e.id}>
              <Link
                href={`/trip/${tripId}/days?event=${e.id}`}
                className="flex items-center gap-3 py-2 text-sm hover:text-pen"
              >
                <span className="nums w-[5.75rem] shrink-0 font-mono text-xs text-ink-soft">
                  {e.time ? (e.endTime ? `${e.time}–${e.endTime}` : e.time) : "All day"}
                </span>
                <EventGlyph type={e.type} transportType={e.transportType} className="shrink-0 text-ink-soft" />
                <span className="min-w-0 truncate">{e.title ?? "Untitled"}</span>
                {e.placeName ? <span className="ml-auto hidden truncate text-xs text-ink-soft sm:inline">{e.placeName}</span> : null}
              </Link>
            </li>
          ))}
        </ol>
      )}
      {plan.files.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {plan.files.map((f) => (
            <li key={f.id}>
              <a
                href={`/trip/${tripId}/files/${f.id}/raw`}
                className="lift inline-flex items-center gap-2 rounded-full border border-rule py-1 pl-2.5 pr-3 text-sm"
              >
                <DocCategoryIcon category={f.category} />
                {f.name}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
