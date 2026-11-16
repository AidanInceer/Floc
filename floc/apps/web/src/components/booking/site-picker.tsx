"use client";

import { SITE_USE, splitBySites, type SiteKind } from "@floc/core/trip/booking/booking-sites";
import type { BookingLink } from "@floc/core/trip/booking/booking-links";
import { useBookingSites } from "@/components/booking/booking-sites";
import { SiteButtons } from "@/components/booking/site-buttons";
import { Menu } from "@/components/system/client-ui";
import { ChevronIcon, OutIcon } from "@/components/system/icons";
import { cx, iconFrameClass } from "@/components/system/ui";

const SITE_MENU_PANEL =
  "w-max min-w-[15rem] max-w-[min(20rem,calc(100vw-2rem))] rounded-md border border-rule-strong bg-sheet p-1 text-left shadow-raised";

export function SitePicker({
  kind,
  links,
  label,
  head,
  align = "right",
  drop = "down",
  className,
}: {
  kind: SiteKind;
  links: BookingLink[];
  label: string;
  head?: string;
  align?: "left" | "right";
  drop?: "down" | "up";
  className?: string;
}) {
  return (
    <div className={cx("flex items-start gap-2", className)}>
      <SiteButtons kind={kind} links={links} />
      <Menu label={`More sites: ${label}`} align={align} drop={drop} trigger={<ChevronIcon direction="down" />} triggerClassName={iconFrameClass()} panelClassName={SITE_MENU_PANEL}>
        <SiteMenuList kind={kind} links={links} head={head} />
      </Menu>
    </div>
  );
}

function SiteMenuList({ kind, links, head }: { kind: SiteKind; links: BookingLink[]; head?: string }) {
  const { sites } = useBookingSites();
  const { mine, more } = splitBySites(links, sites[kind]);
  return (
    <>
      {head ? <p className="nums mb-0.5 border-b border-rule px-2.5 pb-2 pt-1.5 font-mono text-[11px] text-ink-faint">{head}</p> : null}
      <p className="px-2.5 pb-0.5 pt-1.5 text-xs text-ink-faint">Your sites</p>
      {mine.map((l) => <SiteLine key={l.site} link={l} />)}
      {more.length ? <p className="px-2.5 pb-0.5 pt-2 text-xs text-ink-faint">More sites</p> : null}
      {more.map((l) => <SiteLine key={l.site} link={l} use />)}
    </>
  );
}

function SiteLine({ link, use }: { link: BookingLink; use?: boolean }) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      role="menuitem"
      className="flex min-w-0 items-center gap-2.5 rounded-sm px-2.5 py-1.5 text-sm text-ink-2 transition-colors hover:bg-pen-soft hover:text-pen-deep max-sm:py-2.5"
    >
      <OutIcon size={11} />
      <span className="truncate">{link.site}</span>
      {use ? <span className="ml-auto whitespace-nowrap pl-3 text-xs text-ink-faint">{SITE_USE[link.site]}</span> : null}
      <span className="sr-only">(opens another site)</span>
    </a>
  );
}
