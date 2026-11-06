import Link from "next/link";

import { DOC_CATEGORY_CHIPS } from "@floc/core/documents/documents";
import type { BookedHotel } from "@floc/core/trip/booking-links";
import { BedIcon } from "@/components/system/icons/days";
import { cx } from "@/components/system/ui";

/** Stands where the Booking.com and Trip.com links were: this stop already has its hotel. */
export function BookedPill({ tripId, hotel }: { tripId: number; hotel: BookedHotel }) {
  return (
    <Link
      href={`/trip/${tripId}/files`}
      title={hotel.name}
      aria-label={`Booked: ${hotel.name}`}
      className={cx("inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-full py-1 pl-2.5 pr-3 font-mono text-xs transition-colors", DOC_CATEGORY_CHIPS.hotel)}
    >
      <BedIcon size={12} />
      <span className="font-medium">Booked</span>
      <span aria-hidden="true">·</span>
      <span className="truncate font-sans">{hotel.name}</span>
    </Link>
  );
}
