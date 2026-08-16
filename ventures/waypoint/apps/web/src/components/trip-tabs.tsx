"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";

import { cx } from "@/components/ui";
import { type TabState } from "@/lib/tabs";

// Tab clicks are a server round trip, so a pending state is needed or a
// click reads as not having landed. useLinkStatus only reports for the Link
// it's rendered inside, hence the separate child component.
function TabPending() {
  const { pending } = useLinkStatus();
  return (
    <span aria-hidden className="ml-1.5 inline-block w-2 text-left">
      {pending ? "…" : null}
    </span>
  );
}

// Folder tabs (paper.html's `.tabs button`), genuinely attached to the sheet:
// matches Page's width/padding, `-mb-px` pulls the strip onto the sheet's top
// border with the active tab dropping its own bottom border to share the
// opening, and an inactive tab sits a pixel lower with all four borders.
//
// Every tab is navigable from day one (ticket 126) — no un-clickable stubs.
export function TripTabs({
  tripId,
  tabs,
}: {
  tripId: number;
  tabs: TabState[];
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Trip sections"
      // `pb-px` gives the raised inactive tabs somewhere to sit inside the
      // scroll box, and `-mb-0.5` (2px) still lands the strip 1px over the
      // sheet's top border once that padding is accounted for.
      className="scroll-x-bare relative z-10 -mb-0.5 mt-4 flex items-end gap-[3px] px-0.5 pb-px"
    >
      {tabs.map((tab) => {
        const href = `/trip/${tripId}/${tab.key}`;
        const active = pathname === href;
        const tabClasses =
          "shrink-0 rounded-t-[6px] border px-3.5 pb-2 pt-1.5 font-mono text-[11px] uppercase tracking-[0.06em] transition-colors";

        return (
          <Link
            key={tab.key}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cx(
              tabClasses,
              active
                ? "border-rule border-b-sheet bg-sheet font-semibold text-pen"
                : "translate-y-px border-rule-strong bg-sheet-2 text-ink-soft hover:bg-sheet hover:text-ink",
            )}
          >
            {tab.label}
            <TabPending />
          </Link>
        );
      })}
    </nav>
  );
}
