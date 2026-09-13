import Link from "next/link";

import { formatDateRange, nightsBetween } from "@floc/core/dates/dates";
import type { BookingPlan, StayRow } from "@floc/core/trip/booking-links";
import { OFFSITE_NOTE, SiteLinks } from "@/components/booking/site-links";

const headClass = "font-mono text-[11px] uppercase tracking-[0.06em] text-ink-faint";

function nightsLabel(row: StayRow) {
  const nights = nightsBetween(row.checkIn, row.checkOut);
  return `${formatDateRange(row.checkIn, row.checkOut)} · ${nights} ${nights === 1 ? "night" : "nights"}`;
}

export function BookingCard({ tripId, plan }: { tripId: number; plan: BookingPlan }) {
  const daysHref = `/trip/${tripId}/days`;
  return (
    <section id="booking" className="scroll-mt-24 rounded-md border border-rule bg-sheet p-4 shadow-card">
      <h2 className={headClass}>Get booking</h2>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-b border-rule pb-3">
        <h3 className="text-sm font-medium">Flights</h3>
        <SiteLinks links={plan.flights} />
      </div>

      <div className="pt-3">
        <h3 className="text-sm font-medium">Stays</h3>
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
                    <SiteLinks links={row.links} />
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
