import { Fragment, type ReactNode } from "react";

import type { Leg } from "@floc/core/trip/overview/legs";
import type { TripDocument } from "@/server/documents/documents";
import type { DayEventRow } from "@/server/itinerary/itinerary";
import { Arrival, StopPanel } from "./stop-panel";

export function OverviewStops({
  tripId,
  legs,
  events,
  bookings,
  photos,
}: {
  tripId: number;
  legs: Leg<TripDocument>[];
  events: Map<number, DayEventRow[]>;
  bookings: ReactNode;
  photos: ReactNode;
}) {
  if (legs.length === 0) return photos ? <div className="max-w-[21rem]">{photos}</div> : null;
  const side = bookings || photos;
  return (
    <section aria-labelledby="stops-heading" className="flex flex-col gap-4">
      <h2 id="stops-heading" className="font-display text-xl">
        Stops
      </h2>
      <div className={side ? "grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-10" : "flex flex-col"}>
        <div className="flex min-w-0 flex-col">
          {legs.map((leg) => (
            <Fragment key={leg.no}>
              {leg.no > 1 ? <Arrival leg={leg} /> : null}
              <StopPanel tripId={tripId} leg={leg} events={events} />
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
