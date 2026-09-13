import { stayLinks, type BookingLink, type BookingPlan } from "@floc/core/trip/booking-links";

import { SiteLinks } from "@/components/booking/site-links";
import { cx } from "@/components/system/ui";

export function OverviewBooking({ plan }: { plan: BookingPlan }) {
  const firstStop = plan.stays === "unset" ? undefined : plan.stays.find((s) => s.kind === "stop");
  const stays =
    firstStop?.kind === "stop"
      ? firstStop.links
      : stayLinks({ place: "", checkIn: "", checkOut: "", adults: 1, prefill: false });
  return (
    <section className="rounded-lg bg-sheet p-5 ring-1 ring-rule">
      <h2 className="font-display text-lg">Get booking</h2>
      <div className="mt-3 flex flex-col gap-1.5">
        <BookingRow label="Flights" tone="bg-peri text-peri-ink" icon={<PlaneIcon />} links={plan.flights} />
        <BookingRow label="Stays" tone="bg-blush text-blush-ink" icon={<BedIcon />} links={stays} />
      </div>
    </section>
  );
}

function BookingRow({
  label,
  tone,
  icon,
  links,
}: {
  label: string;
  tone: string;
  icon: React.ReactNode;
  links: BookingLink[];
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-md bg-sheet-2 px-2.5 py-2">
      <span role="img" aria-label={label} className={cx("grid size-7 shrink-0 place-items-center rounded-sm", tone)}>
        {icon}
      </span>
      <SiteLinks links={links} />
    </div>
  );
}

const line = {
  viewBox: "0 0 14 14",
  width: 14,
  height: 14,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

function PlaneIcon() {
  return (
    <svg {...line}>
      <path d="M12.4 2.4 6.2 8.6M12.4 2.4l-4 9.8-2.2-3.6-3.6-2.2Z" />
    </svg>
  );
}

function BedIcon() {
  return (
    <svg {...line}>
      <path d="M1.8 11.5V3.5M1.8 8.2h10.4v3.3M12.2 8.2V7a1.5 1.5 0 0 0-1.5-1.5H6.2v2.7" />
      <circle cx="4" cy="6.4" r="1" />
    </svg>
  );
}
