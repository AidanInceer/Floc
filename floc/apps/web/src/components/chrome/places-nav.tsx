"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { cx } from "@/components/system/ui";
import { NavGlyph, type NavGlyphName } from "@/components/chrome/nav-glyphs";
import { useEdgeFade } from "@/components/chrome/use-edge-fade";
import { BEAD } from "@/components/chrome/bead";
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
      className={cx(BEAD, "scroll-x-bare min-w-0 gap-0.5")}
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={item.href === current ? "page" : undefined}
          className="group flex h-full shrink-0 items-center rounded-full px-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink aria-[current=page]:text-ink sm:gap-1.5 sm:pr-3.5"
        >
          <span className="inline-flex size-[26px] items-center justify-center rounded-full text-ink-faint transition-colors group-hover:bg-sheet-3 group-hover:text-ink group-aria-[current=page]:bg-pen-soft group-aria-[current=page]:text-pen-deep">
            <NavGlyph name={item.glyph} />
          </span>
          <span className="sr-only sm:not-sr-only">{item.label}</span>
          {item.badge}
        </Link>
      ))}
    </nav>
  );
}
