"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type CSSProperties, type ReactNode } from "react";

import { SECTION_COLOURS } from "@floc/core/design/section-colours";

import { NavGlyph } from "@/components/system/icons/nav";
import { useEdgeFade } from "@/components/chrome/use-edge-fade";
import { activeHref } from "@/lib/active-href";
import { type TabState } from "@/lib/tabs";
import "./trip-tabs.css";

// Why: Packing and Notes write on first open (auto-fill, first page), so only a real visit may load them in full.
const WRITES_ON_OPEN = new Set(["packing", "notes"]);

// Every tab is navigable from day one (ticket 126); no un-clickable stubs.
export function TripTabs({ tripId, tabs, children }: { tripId: number; tabs: TabState[]; children?: ReactNode }) {
  const pathname = usePathname();
  const hrefOf = (tab: TabState) => `/trip/${tripId}/${tab.key}`;
  const current = activeHref(pathname, tabs.map(hrefOf));
  const router = useRouter();
  // Why: a tab loaded in full before the click opens without the loading skeleton, and React holds content
  // back 300 ms after a skeleton shows. Hover, focus or touch gives the page that head start.
  const warm = (tab: TabState) => () => {
    const href = hrefOf(tab);
    if (href !== current && !WRITES_ON_OPEN.has(tab.key)) router.prefetch(href);
  };
  const fade = useEdgeFade<HTMLElement>();
  const nav = fade.ref;

  // On a phone the row scrolls, and the tab you opened can sit cut off at the edge.
  useEffect(() => {
    nav.current
      ?.querySelector('[aria-current="page"]')
      ?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [nav, current]);

  return (
    <div className="flex min-w-0 flex-1 items-center justify-center gap-2 sm:gap-5">
      <nav
        ref={fade.ref}
        onScroll={fade.onScroll}
        style={fade.style}
        aria-label="Trip sections"
        className="scroll-x-bare flex h-11 max-w-full items-center gap-2 sm:gap-5"
      >
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={hrefOf(tab)}
            style={{
              "--section-wash": `var(--pastel-${SECTION_COLOURS[tab.key]})`,
              "--section-ink": `var(--pastel-${SECTION_COLOURS[tab.key]}-ink)`,
            } as CSSProperties}
            aria-current={hrefOf(tab) === current ? "page" : undefined}
            onMouseEnter={warm(tab)}
            onFocus={warm(tab)}
            onTouchStart={warm(tab)}
            className="trip-tab flex h-full min-w-8 shrink-0 items-center justify-center gap-1.5 text-sm font-medium text-ink-faint transition-colors hover:text-ink-soft aria-[current=page]:text-ink has-[[data-tab-pending]]:text-ink sm:min-w-0"
          >
            <span className="trip-tab-icon inline-flex size-[26px] items-center justify-center rounded-sm transition-colors">
              <NavGlyph name={tab.key} />
            </span>
            <span className="sr-only sm:not-sr-only">{tab.label}</span>
            <PendingMark />
          </Link>
        ))}
      </nav>
      {/* Why: outside the nav, which scrolls sideways and would clip the menu's panel. */}
      {children}
    </div>
  );
}

/** Why: the pressed tab takes its open look at once (trip-tabs.css), not when its page arrives. */
function PendingMark() {
  const { pending } = useLinkStatus();
  return pending ? <span data-tab-pending hidden /> : null;
}
