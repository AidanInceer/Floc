"use client";

import { splitBySites, type SiteKind } from "@floc/core/trip/booking/booking-sites";
import type { BookingLink } from "@floc/core/trip/booking/booking-links";
import { useBookingSites } from "@/components/booking/booking-sites";
import { OutIcon } from "@/components/system/icons";
import { ExternalButtonLink, cx } from "@/components/system/ui";

export function SiteButtons({ kind, links, className }: { kind: SiteKind; links: BookingLink[]; className?: string }) {
  const { sites, fresh } = useBookingSites();
  const { mine } = splitBySites(links, sites[kind]);
  return (
    <div className={cx("flex min-w-0 flex-wrap items-center gap-2", className)}>
      {mine.map((l) => (
        <ExternalButtonLink key={l.site} href={l.url} className={cx("max-sm:px-2.5", l.site === fresh && "site-fresh")}>
          {l.site}
          <OutIcon size={11} />
          <span className="sr-only">(opens another site)</span>
        </ExternalButtonLink>
      ))}
    </div>
  );
}
