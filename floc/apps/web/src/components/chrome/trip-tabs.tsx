"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type CSSProperties, type ReactNode } from "react";

import { SECTION_COLOURS } from "@floc/core/design/section-colours";

import { NavGlyph } from "@/components/system/icons/nav";
import { useEdgeFade } from "@/components/chrome/use-edge-fade";
import { activeHref } from "@/lib/active-href";
import { type TabState } from "@/lib/tabs";
import "./trip-tabs.css";

// Every tab is navigable from day one (ticket 126); no un-clickable stubs.
export function TripTabs({ tripId, tabs, children }: { tripId: number; tabs: TabState[]; children?: ReactNode }) {
  const pathname = usePathname();
  const hrefOf = (tab: TabState) => `/trip/${tripId}/${tab.key}`;
  const current = activeHref(pathname, tabs.map(hrefOf));
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
        className="scroll-x-bare flex max-w-full items-center gap-2 sm:gap-5"
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
            className="trip-tab flex shrink-0 items-center gap-1.5 py-1.5 text-sm font-medium text-ink-faint transition-colors hover:text-ink-soft aria-[current=page]:text-ink"
          >
            <span className="trip-tab-icon inline-flex size-8 items-center sm:size-6 justify-center rounded-sm transition-colors">
              <NavGlyph name={tab.key} />
            </span>
            <span className="sr-only sm:not-sr-only">{tab.label}</span>
          </Link>
        ))}
      </nav>
      {/* Why: outside the nav, which scrolls sideways and would clip the menu's panel. */}
      {children}
    </div>
  );
}
