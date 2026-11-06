import Link from "next/link";

import { formatDateRange, nightsBetween } from "@floc/core/dates/dates";
import type { BookingPlan, StayRow } from "@floc/core/trip/booking-links";
import { BookedPill } from "@/components/booking/booked-pill";
import { HotelUpload } from "@/components/booking/hotel-upload";
import { OFFSITE_NOTE, SiteLinks } from "@/components/booking/site-links";
import { BedIcon, EventGlyph } from "@/components/system/icons/days";

const headClass = "font-mono text-[11px] uppercase tracking-[0.06em] text-ink-faint";
const panelClass = "rounded-sm border border-rule bg-sheet-2 px-3 py-2.5";
const panelHeadClass = "flex items-center gap-2 text-sm font-medium";

function nightsLabel(row: StayRow) {
  const nights = nightsBetween(row.checkIn, row.checkOut);
  return `${formatDateRange(row.checkIn, row.checkOut)} · ${nights} ${nights === 1 ? "night" : "nights"}`;
}

export function BookingCard({ tripId, plan, files }: { tripId: number; plan: BookingPlan; files: boolean }) {
  const daysHref = `/trip/${tripId}/days`;
  return (
    <section id="booking" className="scroll-mt-24 rounded-md border border-rule bg-sheet p-4 shadow-card">
      <h2 className={headClass}>Get booking</h2>

      <div className={`mt-3 flex flex-wrap items-center justify-between gap-2 ${panelClass}`}>
        <h3 className={panelHeadClass}>
          <EventGlyph type="transport" transportType="flight" className="text-ink-soft" />
          Flights
        </h3>
        <SiteLinks links={plan.flights} />
      </div>

      <div className={`mt-3 ${panelClass}`}>
        <h3 className={panelHeadClass}>
          <BedIcon className="text-ink-soft" />
          Stays
        </h3>
        {plan.stays === "unset" ? (
          <Link href={daysHref} className="mt-1 inline-block text-sm text-pen hover:text-pen-deep">
            Set where you sleep on Days to find a stay →
          </Link>
        ) : (
          <ul className="mt-1 divide-y divide-rule">
            {plan.stays.map((row) => (
              <li key={row.checkIn} className="flex flex-wrap items-center justify-between gap-2 py-2">
                {row.kind === "stop" ? (
                  <>
                    <div>
                      <p className="text-sm">{row.placeName}</p>
                      <p className="nums font-mono text-[11px] text-ink-faint">{nightsLabel(row)}</p>
                    </div>
                    <div className="min-w-0 max-sm:order-2 max-sm:basis-full sm:ml-auto">
                      {row.hotel ? <BookedPill tripId={tripId} hotel={row.hotel} /> : <SiteLinks links={row.links} />}
                    </div>
                    {files ? (
                      <div className="max-sm:order-1 max-sm:ml-auto">
                        <HotelUpload tripId={tripId} dayId={row.dayId} place={row.placeName} />
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="w-full rounded-md border border-dashed border-rule bg-sheet-2 px-3 py-2">
                    <p className="text-sm text-ink-soft">
                      No stop yet · {formatDateRange(row.checkIn, row.checkOut)}
                    </p>
                    <Link href={daysHref} className="text-sm text-pen hover:text-pen-deep">
                      Set where you sleep on Days →
                    </Link>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-3 text-[11px] text-ink-faint">{OFFSITE_NOTE}</p>
    </section>
  );
}
