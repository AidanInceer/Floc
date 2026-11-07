import Link from "next/link";

import { formatDateRange, formatShortRange, nightsBetween } from "@floc/core/dates/dates";
import type { BookingPlan, StayRow } from "@floc/core/trip/booking/booking-links";
import type { BookingSites } from "@floc/core/trip/booking/booking-sites";
import { BookedPill } from "@/components/booking/booked-pill";
import { HotelUpload } from "@/components/booking/hotel-upload";
import { BookingSitesProvider } from "@/components/booking/booking-sites";
import { OFFSITE_NOTE } from "@/components/booking/site-links";
import { SitePicker } from "@/components/booking/site-picker";
import { BedIcon, EventGlyph } from "@/components/system/icons/days";

const headClass = "font-mono text-[11px] uppercase tracking-[0.06em] text-ink-faint";
const panelClass = "rounded-sm border border-rule bg-sheet-2 px-3 py-2.5 max-sm:px-2.5";
const panelHeadClass = "flex items-center gap-2 text-sm font-medium";

function nightsLabel(row: StayRow) {
  const nights = nightsBetween(row.checkIn, row.checkOut);
  return `${formatDateRange(row.checkIn, row.checkOut)} · ${nights} ${nights === 1 ? "night" : "nights"}`;
}

export function BookingCard({ tripId, plan, files, sites }: { tripId: number; plan: BookingPlan; files: boolean; sites: BookingSites }) {
  const daysHref = `/trip/${tripId}/days`;
  return (
    <BookingSitesProvider initial={sites}>
    <section id="booking" className="scroll-mt-24 rounded-md border border-rule bg-sheet p-4 shadow-card max-sm:p-3">
      <h2 className={headClass}>Get booking</h2>

      <div className={`mt-3 flex flex-wrap items-center justify-between gap-2 ${panelClass}`}>
        <h3 className={panelHeadClass}>
          <EventGlyph type="transport" transportType="flight" className="text-ink-soft" />
          Flights
        </h3>
        <SitePicker kind="flights" links={plan.flights} label="Search flights" className="sm:justify-end" />
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
                      {row.hotel ? <BookedPill tripId={tripId} hotel={row.hotel} /> : <SitePicker kind="stays" links={row.links} label={`Find a stay in ${row.placeName}`} head={`${row.placeName} · ${formatShortRange(row.checkIn, row.checkOut)}`} className="sm:justify-end" />}
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
    </BookingSitesProvider>
  );
}
