"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { cx } from "@/components/system/ui";
import { NavGlyph, type NavGlyphName } from "@/components/system/icons/nav";
import { useEdgeFade } from "@/components/chrome/use-edge-fade";
import { BEAD, BEAD_ITEM, BEAD_ITEMS, BEAD_TILE } from "@/components/chrome/bead";
import { activeHref } from "@/lib/active-href";

export type PlaceItem = {
  href: string;
  label: string;
  glyph: NavGlyphName;
  badge?: ReactNode;
};

// A trip lives at `/trip/…`, but it is one of your Trips — the tile stays on Trips inside one.
const UNDER = { "/trip/": "/trips" };

export function PlacesNav({ label, items }: { label: string; items: PlaceItem[] }) {
  const pathname = usePathname();
  const current = activeHref(pathname, items.map((item) => item.href), UNDER);
  const fade = useEdgeFade<HTMLElement>();

  return (
    <nav
      ref={fade.ref}
      onScroll={fade.onScroll}
      style={fade.style}
      aria-label={label}
      className={cx(BEAD, BEAD_ITEMS, "scroll-x-bare min-w-0")}
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={item.href === current ? "page" : undefined}
          className={cx(BEAD_ITEM, "sm:pr-2 sm:last:pr-3.5")}
        >
          <span className={cx(BEAD_TILE, "relative")}>
            <NavGlyph name={item.glyph} />
            {item.badge}
          </span>
          <span data-fuse="label" className="sr-only sm:not-sr-only">
            {item.label}
          </span>
        </Link>
      ))}
    </nav>
  );
}
