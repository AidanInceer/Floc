"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { NavGlyph } from "@/components/chrome/nav-glyphs";
import { useEdgeFade } from "@/components/chrome/use-edge-fade";
import { activeHref } from "@/lib/active-href";
import { type TabState } from "@/lib/tabs";

// Every tab is navigable from day one (ticket 126); no un-clickable stubs.
// The current glyph takes the same blue tile as the place above it in the top bar.
export function TripTabs({ tripId, tabs }: { tripId: number; tabs: TabState[] }) {
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
    <div className="flex min-w-0 flex-1 justify-center">
      <nav
        ref={fade.ref}
        onScroll={fade.onScroll}
        style={fade.style}
        aria-label="Trip sections"
        className="scroll-x-bare flex max-w-full items-center gap-4 sm:gap-5"
      >
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={hrefOf(tab)}
            data-tour={tab.key}
            aria-current={hrefOf(tab) === current ? "page" : undefined}
            className="group flex shrink-0 items-center gap-1.5 py-1.5 text-sm font-medium text-ink-faint transition-colors hover:text-ink-soft aria-[current=page]:text-ink"
          >
            <span className="inline-flex size-6 items-center justify-center rounded-[7px] transition-colors group-hover:bg-sheet-3 group-aria-[current=page]:bg-pen-soft group-aria-[current=page]:text-pen-deep">
              <NavGlyph name={tab.key} />
            </span>
            {tab.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
