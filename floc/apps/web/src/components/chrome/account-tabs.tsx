import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { PersonIcon, SlidersIcon } from "@/components/system/icons/account";
import { NavGlyph } from "@/components/system/icons/nav";
import { ReactionGlyph } from "@/components/system/icons/reaction";
import "./trip-tabs.css";

export type AccountTabKey = "profile" | "settings" | "saved" | "packing";

// Why: Lists' two pages are tabs of their own, so the bar is the same four on every account page and nothing opens or moves (#467).
const TABS: {
  key: AccountTabKey;
  href: string;
  label: string;
  icon: ReactNode;
}[] = [
  { key: "profile", href: "/profile", label: "Profile", icon: <PersonIcon /> },
  { key: "settings", href: "/settings", label: "Settings", icon: <SlidersIcon /> },
  { key: "saved", href: "/lists", label: "Saved", icon: <ReactionGlyph kind="heart" mine={false} /> },
  { key: "packing", href: "/lists/packing", label: "Packing", icon: <NavGlyph name="packing" /> },
];

// Why: no feature pastel — these pages are not a feature area, so the open tab takes the plain selected wash.
const SELECTED = {
  "--section-wash": "var(--pen-2)",
  "--section-ink": "var(--pen-deep)",
} as CSSProperties;

/** The bar under the header on your own account pages, drawn like the trip bar. */
export function AccountTabs({ current }: { current: AccountTabKey }) {
  return (
    <div className="bg-paper">
      <div className="mx-auto flex w-full max-w-[84rem] items-center justify-center px-4 py-2.5 sm:px-6">
        <nav aria-label="Your account" className="flex items-center gap-3 sm:gap-5">
          {TABS.map((tab) => (
            <Link
              key={tab.key}
              href={tab.href}
              style={SELECTED}
              aria-current={tab.key === current ? "page" : undefined}
              className="trip-tab flex shrink-0 items-center gap-1.5 py-1.5 text-sm font-medium text-ink-faint transition-colors hover:text-ink-soft aria-[current=page]:text-ink"
            >
              <span className="trip-tab-icon inline-flex size-8 items-center justify-center rounded-sm transition-colors sm:size-6">
                {tab.icon}
              </span>
              {/* Why: four names do not fit a phone's width; the glyphs stay, and the names stay for readers. */}
              <span className="max-sm:sr-only">{tab.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
