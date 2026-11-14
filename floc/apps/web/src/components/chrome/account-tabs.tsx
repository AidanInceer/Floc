import Link from "next/link";
import { Fragment, type CSSProperties, type ReactNode } from "react";

import { ACCOUNT_CLUSTERS, accountTabCounts, type AccountTabKey } from "@/lib/chrome/account-tabs";
import { topBarFor, TOP_BAR_PREVIEW } from "@/server/chrome/top-bar";
import { BookmarkIcon, EnvelopeIcon, GroupIcon, PersonIcon } from "@/components/system/icons/account";
import { NavGlyph } from "@/components/system/icons/nav";
import { ReactionGlyph } from "@/components/system/icons/reaction";
import "./trip-tabs.css";

export type { AccountTabKey };

function iconFor(key: AccountTabKey, open: boolean): ReactNode {
  switch (key) {
    case "profile": return <PersonIcon />;
    case "friends": return <NavGlyph name="friends" />;
    case "groups": return <GroupIcon />;
    case "wish": return <BookmarkIcon filled={open} />;
    case "saved": return <ReactionGlyph kind="heart" mine={open} size={14} />;
    case "packing": return <NavGlyph name="packing" />;
    case "bookings": return <EnvelopeIcon />;
  }
}

// Why: these pages are not a feature area, so the open tab takes the plain selected wash; Saved and Wish lists wear their own marks' colours (#637).
const SELECTED = { "--section-wash": "var(--pen-2)", "--section-ink": "var(--pen-deep)" } as CSSProperties;
const WASH: Partial<Record<AccountTabKey, CSSProperties>> = {
  saved: { "--section-wash": "var(--pastel-red)", "--section-ink": "var(--pastel-red-ink)" } as CSSProperties,
  wish: { "--section-wash": "var(--pen-2)", "--section-ink": "var(--pen)" } as CSSProperties,
};

const pipClass =
  "absolute -right-1.5 -top-1.5 min-w-4 rounded-full border-2 border-paper bg-pen px-1 text-center font-mono text-[11px] font-semibold leading-[13px] text-sheet";

/** The bar under the header on every account page: one level, four clusters, the same on each (#467, #623, #637). */
export async function AccountTabs({ current, userId }: { current: AccountTabKey; userId: string }) {
  const { friendRequestCount, bookings } = await topBarFor(userId, TOP_BAR_PREVIEW);
  const counts = accountTabCounts({ friendRequestCount, bookingCount: bookings.files.length });
  const open = ACCOUNT_CLUSTERS.flat().find((tab) => tab.key === current);

  return (
    <div className="bg-paper">
      <div className="mx-auto flex w-full max-w-[84rem] flex-col items-center px-2 py-2.5 sm:px-6">
        <nav aria-label="Your account" className="flex w-full items-center justify-between sm:w-auto sm:justify-center sm:gap-5">
          {ACCOUNT_CLUSTERS.map((cluster, i) => (
            <Fragment key={cluster[0].key}>
              {i ? <span aria-hidden className="h-5 w-px shrink-0 bg-rule-strong sm:mx-0.5" /> : null}
              {cluster.map((tab) => {
                const isOpen = tab.key === current;
                const count = counts[tab.key];
                return (
                  <Link
                    key={tab.key}
                    href={tab.href}
                    style={WASH[tab.key] ?? SELECTED}
                    aria-current={isOpen ? "page" : undefined}
                    aria-label={count ? `${tab.label}, ${count} waiting` : tab.label}
                    className="trip-tab flex shrink-0 items-center justify-center gap-1.5 max-sm:flex-1 whitespace-nowrap py-1.5 text-sm font-medium text-ink-faint transition-colors hover:text-ink-soft aria-[current=page]:text-ink"
                  >
                    <span className="trip-tab-icon relative inline-flex size-8 items-center justify-center rounded-sm transition-colors sm:size-6">
                      {iconFor(tab.key, isOpen)}
                      {count ? <span aria-hidden className={pipClass}>{count > 99 ? "99+" : count}</span> : null}
                    </span>
                    {/* Why: seven names do not fit a phone's width; the glyphs stay, and the open page is named below. */}
                    <span aria-hidden className="max-sm:hidden">{tab.label}</span>
                  </Link>
                );
              })}
            </Fragment>
          ))}
        </nav>
        {open ? <p aria-hidden className="pt-1 text-[13px] font-medium text-ink sm:hidden">{open.label}</p> : null}
      </div>
    </div>
  );
}
