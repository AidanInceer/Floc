import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import {
  ListIcon,
  PersonIcon,
  SlidersIcon,
} from "@/components/system/icons/account";
import { ListsCapsule } from "./lists-branch";
import "./trip-tabs.css";

export type AccountTabKey = "profile" | "settings" | "lists";

// Why: the same three doors as the account menu's tiles, in the same order.
const TABS: {
  key: AccountTabKey;
  href: string;
  label: string;
  icon: ReactNode;
}[] = [
  { key: "profile", href: "/profile", label: "Profile", icon: <PersonIcon /> },
  {
    key: "settings",
    href: "/settings",
    label: "Settings",
    icon: <SlidersIcon />,
  },
  {
    key: "lists",
    href: "/lists",
    label: "Lists",
    icon: <ListIcon />,
  },
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
        <nav
          aria-label="Your account"
          className="flex items-center gap-4 sm:gap-5"
        >
          {TABS.map((tab) =>
            tab.key === "lists" && current === "lists" ? (
              <ListsCapsule key={tab.key} />
            ) : (
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
              {/* Why: on a phone the open Lists capsule needs the room; the other tabs keep their glyphs and names for readers. */}
              <span className={current === "lists" ? "max-sm:sr-only" : undefined}>{tab.label}</span>
            </Link>
            ),
          )}
        </nav>
      </div>
    </div>
  );
}
