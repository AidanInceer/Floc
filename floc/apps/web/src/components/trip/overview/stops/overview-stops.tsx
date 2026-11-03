// Why: Explore's stop-by-stop, kept short — the Days tab owns the day; here a day says what comes first and links there.
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
}: {
  tripId: number;
  legs: Leg<TripDocument>[];
  events: Map<number, DayEventRow[]>;
  /** The bookings beside the stops; none once the trip has ended. */
  bookings: ReactNode;
}) {
  if (legs.length === 0) return null;
  return (
    <section aria-labelledby="stops-heading" className="flex flex-col gap-4">
      <h2 id="stops-heading" className="font-display text-xl">
        Stops
      </h2>
      <div className={bookings ? "grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-10" : "flex flex-col"}>
        <div className="flex min-w-0 flex-col">
          {legs.map((leg) => (
            <Fragment key={leg.no}>
              {leg.no > 1 ? <Arrival leg={leg} /> : null}
              <StopPanel tripId={tripId} leg={leg} events={events} />
            </Fragment>
          ))}
        </div>
        {bookings}
      </div>
    </section>
  );
}
