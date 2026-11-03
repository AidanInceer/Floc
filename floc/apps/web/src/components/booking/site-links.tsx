import type { BookingLink } from "@floc/core/trip/booking-links";
import { OutIcon } from "@/components/system/icons";
import { ExternalButtonLink } from "@/components/system/ui";

export function SiteLinks({ links }: { links: BookingLink[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {links.map((l) => (
        <ExternalButtonLink key={l.site} href={l.url}>
          {l.site}
          <OutIcon size={11} />
          <span className="sr-only">(opens another site)</span>
        </ExternalButtonLink>
      ))}
    </div>
  );
}

export const OFFSITE_NOTE = "Opens another site. Floc isn't paid for these links.";
