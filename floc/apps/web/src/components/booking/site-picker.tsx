"use client";

import { MAX_SITES, SITE_USE, canToggleSite, splitBySites, type SiteKind } from "@floc/core/trip/booking-sites";
import type { BookingLink } from "@floc/core/trip/booking-links";
import { useBookingSites } from "@/components/booking/booking-sites";
import { Menu } from "@/components/system/client-ui";
import { CheckIcon, ChevronIcon, OutIcon } from "@/components/system/icons";
import { ExternalButtonLink, cx } from "@/components/system/ui";

const CHEVRON =
  "grid h-[30px] w-[30px] place-items-center rounded-sm border border-rule-strong bg-sheet text-ink-2 hover:border-pen hover:bg-pen-soft hover:text-pen-deep data-[open=true]:border-pen data-[open=true]:bg-pen-soft data-[open=true]:text-pen-deep";
export const SITE_MENU_PANEL =
  "w-max min-w-[15rem] max-w-[min(20rem,calc(100vw-2rem))] rounded-md border border-rule-strong bg-sheet p-1 text-left shadow-raised";

/** Your sites as buttons, and every other site behind the chevron (wireframe/booking-sites J). */
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
  /** What the links are for, said to a screen reader on the chevron: "Find a stay in Dover". */
  label: string;
  /** Which stay or flight the menu is for, as the mockup's head line: "Lisbon · 15–18 Dec". */
  head?: string;
  align?: "left" | "right";
  /** Up near the foot of a dialog, which would otherwise clip it. */
  drop?: "down" | "up";
  className?: string;
}) {
  const { sites, fresh } = useBookingSites();
  const { mine } = splitBySites(links, sites[kind]);
  return (
    <div className={cx("flex flex-wrap items-center gap-2", className)}>
      {mine.map((l) => (
        <ExternalButtonLink key={l.site} href={l.url} className={cx("max-sm:px-2.5", l.site === fresh && "site-fresh")}>
          {l.site}
          <OutIcon size={11} />
          <span className="sr-only">(opens another site)</span>
        </ExternalButtonLink>
      ))}
      <Menu label={`More sites: ${label}`} align={align} drop={drop} trigger={<ChevronIcon direction="down" size={12} />} triggerClassName={CHEVRON} panelClassName={SITE_MENU_PANEL}>
        <SiteMenuList kind={kind} links={links} head={head} />
      </Menu>
    </div>
  );
}

/** Your sites, then More sites; the tick on each line keeps or drops it, in place. */
export function SiteMenuList({ kind, links, head }: { kind: SiteKind; links: BookingLink[]; head?: string }) {
  const { sites } = useBookingSites();
  const { mine, more } = splitBySites(links, sites[kind]);
  return (
    <>
      {head ? <p className="nums mb-0.5 border-b border-rule px-2.5 pb-2 pt-1.5 font-mono text-[11px] text-ink-faint">{head}</p> : null}
      <p className="flex items-baseline justify-between px-2.5 pb-0.5 pt-1.5 text-xs text-ink-faint">
        Your sites
        <span className="nums font-mono text-[11px]">
          {mine.length} of {MAX_SITES}
        </span>
      </p>
      {mine.map((l) => <SiteLine key={l.site} kind={kind} link={l} />)}
      {more.length ? <p className="px-2.5 pb-0.5 pt-2 text-xs text-ink-faint">More sites</p> : null}
      {more.map((l) => <SiteLine key={l.site} kind={kind} link={l} use />)}
    </>
  );
}

function SiteLine({ kind, link, use }: { kind: SiteKind; link: BookingLink; use?: boolean }) {
  const { sites, toggle } = useBookingSites();
  const on = (sites[kind] as string[]).includes(link.site);
  const can = canToggleSite(sites, kind, link.site);
  // Why: a greyed tick says nothing on its own, so its name says why it is held.
  const why = can ? "" : on ? " (keep at least one)" : ` (up to ${MAX_SITES})`;
  return (
    <div className="flex items-center gap-1">
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        role="menuitem"
        className="flex min-w-0 flex-1 items-center gap-2.5 rounded-sm px-2.5 py-1.5 text-sm text-ink-2 transition-colors hover:bg-pen-soft hover:text-pen-deep max-sm:py-2.5"
      >
        <OutIcon size={11} />
        <span className="truncate">{link.site}</span>
        {use ? <span className="ml-auto whitespace-nowrap pl-3 text-xs text-ink-faint">{SITE_USE[link.site]}</span> : null}
        <span className="sr-only">(opens another site)</span>
      </a>
      <button
        type="button"
        role="menuitemcheckbox"
        aria-checked={on}
        aria-label={(on ? `Drop ${link.site} from your sites` : `Add ${link.site} to your sites`) + why}
        title={why ? why.slice(2, -1).replace(/^./, (c) => c.toUpperCase()) : undefined}
        disabled={!can}
        onClick={() => toggle(kind, link.site)}
        className={cx(
          // Why: the after: box gives a phone a ~42px press target without drawing a bigger tick.
          "relative mr-0.5 grid size-[26px] shrink-0 place-items-center rounded-sm border transition-colors after:absolute after:-inset-x-2 after:-inset-y-1 after:content-[''] disabled:cursor-default disabled:opacity-40",
          on ? "border-pen bg-pen text-sheet" : "border-rule-strong bg-sheet text-transparent enabled:hover:border-pen enabled:hover:text-pen-edge",
        )}
      >
        <CheckIcon size={12} />
      </button>
    </div>
  );
}
