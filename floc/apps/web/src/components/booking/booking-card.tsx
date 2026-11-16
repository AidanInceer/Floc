import Link from "next/link";

import { formatDateRange, nightsBetween } from "@floc/core/dates/dates";
import type { BookingPlan, StayRow } from "@floc/core/trip/booking/booking-links";
import type { BookingSites } from "@floc/core/trip/booking/booking-sites";
import { BookedPill } from "@/components/booking/booked-pill";
import { BookingSitesDialog } from "@/components/booking/booking-sites-dialog";
import { HotelUpload } from "@/components/booking/hotel-upload";
import { BookingSitesProvider } from "@/components/booking/booking-sites";
import { OFFSITE_NOTE } from "@/components/booking/site-links";
import { SiteButtons } from "@/components/booking/site-buttons";
import { Menu } from "@/components/system/client-ui";
import { BedIcon, EventGlyph } from "@/components/system/icons/days";
import { cx, menuItemClass, panelBandClass } from "@/components/system/ui";
import { countWord } from "@floc/core/text/count-word";

const partHeadClass = "flex items-center gap-2 text-sm font-medium";

type Stop = Extract<StayRow, { kind: "stop" }>;

function nightsLabel(row: StayRow) {
  const nights = nightsBetween(row.checkIn, row.checkOut);
  return `${formatDateRange(row.checkIn, row.checkOut)} · ${countWord(nights, "night")}`;
}

export function BookingCard({ tripId, plan, files, sites }: { tripId: number; plan: BookingPlan; files: boolean; sites: BookingSites }) {
  const daysHref = `/trip/${tripId}/days`;
  return (
    <BookingSitesProvider initial={sites}>
      <section id="booking" className="scroll-mt-24 rounded-md border border-rule bg-sheet shadow-card">
        <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-4 max-sm:px-4">
          <h2 className="font-display text-lg">Get booking</h2>
          <BookingSitesDialog />
        </div>

        <div className={cx(panelBandClass, "flex flex-wrap items-center justify-between gap-x-3 gap-y-2 py-3")}>
          <h3 className={partHeadClass}>
            <EventGlyph type="transport" transportType="flight" className="text-ink-soft" />
            Flights
          </h3>
          <SiteButtons kind="flights" links={plan.flights} />
        </div>

        <div className={cx(panelBandClass, "pb-1 pt-3")}>
          <h3 className={partHeadClass}>
            <BedIcon className="text-ink-soft" />
            Stays
          </h3>
          {plan.stays === "unset" ? (
            <Link href={daysHref} className="mb-3 mt-1 inline-block text-sm text-pen hover:text-pen-deep">
              Set where you sleep on Days to find a stay →
            </Link>
          ) : (
            <ul className="mt-1 divide-y divide-rule">
              {plan.stays.map((row) => (
                <li key={row.checkIn} className="py-2.5">
                  {row.kind === "stop" ? (
                    <StopRow tripId={tripId} row={row} files={files} daysHref={daysHref} />
                  ) : (
                    <div className="rounded-sm border border-dashed border-rule bg-sheet-2 px-3 py-2">
                      <p className="text-sm text-ink-soft">No stop yet · {formatDateRange(row.checkIn, row.checkOut)}</p>
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

        <p className="px-5 pb-4 text-xs text-ink-faint max-sm:px-4">{OFFSITE_NOTE}</p>
      </section>
    </BookingSitesProvider>
  );
}

function StopRow({ tripId, row, files, daysHref }: { tripId: number; row: Stop; files: boolean; daysHref: string }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <div className="min-w-0 flex-1">
        <p className="text-sm">{row.placeName}</p>
        <p className="nums font-mono text-xs text-ink-faint">{nightsLabel(row)}</p>
      </div>
      <div className="flex min-w-0 items-center max-sm:order-1 max-sm:basis-full">
        {row.hotel ? <BookedPill tripId={tripId} hotel={row.hotel} /> : <SiteButtons kind="stays" links={row.links} />}
      </div>
      <Menu label={`More for ${row.placeName}`}>
        {files ? <HotelUpload tripId={tripId} dayId={row.dayId} place={row.placeName} /> : null}
        <Link href={daysHref} role="menuitem" className={menuItemClass}>
          <span className="flex items-center gap-2">
            <BedIcon size={12} />
            Change where you sleep
          </span>
        </Link>
      </Menu>
    </div>
  );
}
