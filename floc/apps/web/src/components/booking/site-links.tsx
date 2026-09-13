import type { BookingLink } from "@floc/core/trip/booking-links";
import { ExternalButtonLink } from "@/components/system/ui";

function OutIcon() {
  return (
    <svg width={11} height={11} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.2} aria-hidden>
      <path d="M5 2.5h6.5V9M11.5 2.5 2.5 11.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SiteLinks({ links }: { links: BookingLink[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {links.map((l) => (
        <ExternalButtonLink key={l.site} href={l.url}>
          {l.site}
          <OutIcon />
          <span className="sr-only">(opens another site)</span>
        </ExternalButtonLink>
      ))}
    </div>
  );
}

export const OFFSITE_NOTE = "Opens another site. Floc isn't paid for these links.";
