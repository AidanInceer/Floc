// Why: Explore's stop-by-stop, kept short — the Days tab owns the day; here a day says what comes first and links there.
import { Fragment } from "react";

import type { BookingLink } from "@floc/core/trip/booking-links";
import type { Leg } from "@floc/core/trip/overview/legs";
import type { TripDocument } from "@/server/documents/documents";
import type { DayEventRow } from "@/server/itinerary/itinerary";
import { BookingsCard } from "./bookings-card";
import { Arrival, StopPanel } from "./stop-panel";

export function OverviewStops({
  tripId,
  legs,
  wholeTrip,
  files,
  stays,
  events,
}: {
  tripId: number;
  legs: Leg<TripDocument>[];
  wholeTrip: TripDocument[];
  /** False when file storage is off (rule 11): no chips, no upload. */
  files: boolean;
  /** Stay search links by place id, for a stop with nothing booked. */
  stays: Map<number, BookingLink[]>;
  events: Map<number, DayEventRow[]>;
}) {
  if (legs.length === 0) return null;
  return (
    <section aria-labelledby="stops-heading" className="flex flex-col gap-4">
      <h2 id="stops-heading" className="font-display text-xl">
        Stops
      </h2>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-10">
        <div className="flex min-w-0 flex-col">
          {legs.map((leg) => (
            <Fragment key={leg.no}>
              {leg.no > 1 ? <Arrival leg={leg} /> : null}
              <StopPanel tripId={tripId} leg={leg} events={events} />
            </Fragment>
          ))}
        </div>
        <BookingsCard tripId={tripId} legs={legs} wholeTrip={wholeTrip} files={files} stays={stays} />
      </div>
    </section>
  );
}
