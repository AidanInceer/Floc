import { formatDate } from "@floc/core/dates/dates";
import { hopLabel, type Leg } from "@floc/core/trip/overview/legs";
import type { TripDocument } from "@/server/documents/documents";
import type { DayEventRow } from "@/server/itinerary/itinerary";
import { TravelModeIcon } from "@/components/map/travel-mode-icon";
import { StopDay } from "./stop-day";
import { StopNo, cityOf, stopDates } from "./stop-parts";

export function Arrival({ leg }: { leg: Leg<TripDocument> }) {
  return (
    <p className="ml-7 flex min-h-[34px] items-center gap-2 border-l-[1.5px] border-dashed border-rule-strong pl-3.5 font-mono text-xs text-ink-faint">
      {leg.mode ? <TravelModeIcon mode={leg.mode} /> : null}
      {hopLabel(leg.mode, cityOf(leg.placeName))} · {formatDate(leg.arrive)}
    </p>
  );
}

export function StopPanel({
  tripId,
  leg,
  events,
}: {
  tripId: number;
  leg: Leg<TripDocument>;
  events: Map<number, DayEventRow[]>;
}) {
  return (
    <section id={`stop-${leg.no}`} className="scroll-mt-4 rounded-xl border border-rule-strong bg-sheet px-3 pb-2 pt-4 sm:px-[18px] sm:pb-3">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <StopNo no={leg.no} />
        <h3 className="font-display text-xl tracking-[-0.02em]">{cityOf(leg.placeName)}</h3>
        <span className="typed">
          {leg.nights} {leg.nights === 1 ? "night" : "nights"} · {stopDates(leg)}
        </span>
      </header>
      <ol className="mt-3">
        {leg.days.map((d) => (
          <StopDay key={d.dayId} tripId={tripId} date={d.date} events={events.get(d.dayId) ?? []} />
        ))}
      </ol>
    </section>
  );
}
