"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { cx } from "@/components/ui";

export type PillNavItem = {
  href: string;
  label: string;
  /** A count or dot rendered after the label (invites, friend requests). */
  badge?: ReactNode;
};

// A tab click inside a trip is a server round trip; without this a click reads
// as not having landed (ticket 05). useLinkStatus only reports for the Link it
// sits inside, so it must be a separate child.
function PillPending() {
  const { pending } = useLinkStatus();
  return (
    <span aria-hidden className="ml-1 inline-block w-2 text-left">
      {pending ? "…" : null}
    </span>
  );
}

/**
 * The one navigation pill group, used for every nav in the app (ticket 191):
 * the trip's tabs inside a trip, the signed-in surfaces outside one. A recessed
 * track holds the pills; the current page is an ink-filled pill, the rest lift
 * to white on hover. The track scrolls sideways rather than wrapping when the
 * pills outgrow the width.
 */
export function PillNav({
  label,
  items,
  showPending,
  className,
}: {
  label: string;
  items: PillNavItem[];
  /** Trip tabs show an in-flight "…" per pill; the account nav doesn't. */
  showPending?: boolean;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label={label}
      className={cx(
        "scroll-x-bare flex items-center gap-1 rounded-full bg-sheet-2 p-1",
        className,
      )}
    >
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cx(
              "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium",
              active
                ? "bg-ink text-paper"
                : "lift text-ink-soft hover:bg-sheet hover:text-ink",
            )}
          >
            {item.label}
            {item.badge}
            {showPending ? <PillPending /> : null}
          </Link>
        );
      })}
    </nav>
  );
}
