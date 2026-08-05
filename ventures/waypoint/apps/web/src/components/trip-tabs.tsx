"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";

import { cx } from "@/components/ui";
import { type TabState } from "@/lib/tabs";

/**
 * A tab click is a server round trip — every tab renders on the server and
 * reads the database, so there is always some wait. Without a pending state
 * the tab you clicked stays visually inert until the new page swaps in, which
 * reads as the click not having landed and invites a second click.
 *
 * `useLinkStatus` only reports for the `Link` it is rendered inside, so this
 * lives in its own child component.
 */
function TabPending() {
  const { pending } = useLinkStatus();
  return (
    <span aria-hidden className="ml-1.5 inline-block w-2 text-left">
      {pending ? "…" : null}
    </span>
  );
}

/**
 * Folder tabs, per paper.html's `.tabs button` — and genuinely attached to the
 * sheet, not floating above it. The mechanics, all three of which are needed:
 *
 * - This nav sits in a container matching `Page`'s width and padding, and the
 *   trip pages render `<Page wide flush>` so there's no gap to cross.
 * - `-mb-px` pulls the strip down onto the sheet's 1px top border, and the
 *   active tab drops its own bottom border, so the two shapes share an opening
 *   instead of stacking two lines.
 * - An inactive tab sits a pixel lower (paper.html's `top: 1px`) and keeps all
 *   four borders, so it reads as a divider still tucked behind the open page.
 *
 * Every tab is navigable from day one (ticket 126). Route and Days used to
 * render as un-clickable stubs until a first idea or day existed; they now
 * open onto their own empty states, which say the same thing and let you act
 * on it.
 */
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
