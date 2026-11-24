import { Fragment, type ReactNode } from "react";

import type { Leg } from "@floc/core/trip/overview/legs";
import type { TripDocument } from "@/server/documents/documents";
import type { DayEventRow } from "@/server/itinerary/itinerary";
import type { PlanNote } from "@/server/notifications/plan-note";
import { ChangeNote } from "./change-note";
import { Arrival, StopPanel } from "./stop-panel";

export function OverviewStops({
  tripId,
  legs,
  events,
  bookings,
  photos,
  note,
}: {
  tripId: number;
  legs: Leg<TripDocument>[];
  events: Map<number, DayEventRow[]>;
  bookings: ReactNode;
  photos: ReactNode;
  note?: PlanNote | null;
}) {
  const offPlan = note && !legs.some((leg) => leg.days.some((d) => d.date === note.change.date)) ? note : null;
  const loose = offPlan ? <ChangeNote tripId={tripId} note={offPlan} onRow={false} /> : null;
  if (legs.length === 0) {
    return loose || photos ? (
      <div className="flex flex-col gap-3">
        {loose}
        {photos ? <div className="max-w-[21rem]">{photos}</div> : null}
      </div>
    ) : null;
  }
  const side = bookings || photos;
  return (
    <section aria-labelledby="stops-heading" className="flex flex-col gap-4">
      <h2 id="stops-heading" className="font-display text-xl">
        Stops
      </h2>
      {loose}
      <div className={side ? "grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-10" : "flex flex-col"}>
        <div className="flex min-w-0 flex-col">
          {legs.map((leg) => (
            <Fragment key={leg.no}>
              {leg.no > 1 ? <Arrival leg={leg} /> : null}
              <StopPanel tripId={tripId} leg={leg} events={events} note={note} />
            </Fragment>
          ))}
        </div>
        {side ? (
          <aside className="flex min-w-0 flex-col gap-3 max-lg:order-first lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)] lg:overflow-y-auto lg:[scrollbar-width:thin]">
            {bookings}
            {photos}
          </aside>
        ) : null}
      </div>
    </section>
  );
}
