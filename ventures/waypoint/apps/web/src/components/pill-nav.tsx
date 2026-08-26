"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

import { cx } from "@/components/ui";

export type PillNavItem = {
  href: string;
  label: string;
  /** A count or dot rendered after the label (invites, friend requests). */
  badge?: ReactNode;
};

// useLayoutEffect warns during SSR; on the server there is nothing to measure.
const useIsoLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * The one navigation pill group, used for every nav in the app (ticket 191):
 * the trip's tabs inside a trip, the signed-in surfaces outside one. A recessed
 * track holds the pills; the current page is an ink-filled pill, the rest lift
 * to white on hover. The track scrolls sideways rather than wrapping when the
 * pills outgrow the width.
 *
 * The ink fill is a single sliding indicator, not a class on each pill: it
 * measures the active pill and animates its position and width, so moving
 * between tabs slides rather than jumps. Before it has measured, and when no
 * pill is active, it stays hidden and the labels read on the bare track.
 *
 * The track is `--sheet-3`, not `--sheet-2` (ticket 209): against the lifted
 * off-white canvas, sheet-2 was invisible and the group read as loose pills.
 * It is also `w-fit` — a full-width track ran to the right edge of the page
 * with nothing in it.
 */
export function PillNav({
  label,
  items,
  className,
}: {
  label: string;
  items: PillNavItem[];
  className?: string;
}) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const pillRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [indicator, setIndicator] = useState<{
    left: number;
    width: number;
  } | null>(null);

  const activeHref =
    items.find(
      (item) =>
        pathname === item.href || pathname.startsWith(`${item.href}/`),
    )?.href ?? null;

  useIsoLayoutEffect(() => {
    const nav = navRef.current;
    const pill = activeHref ? pillRefs.current[activeHref] : null;
    if (!nav || !pill) {
      setIndicator(null);
      return;
    }
    // Fractional rects, not offsetLeft/offsetWidth: the integer offsets round
    // the indicator a sub-pixel off the pill and expose a sliver on one side,
    // so its curve reads as uneven. scrollLeft keeps it right as the track
    // scrolls sideways.
    const navRect = nav.getBoundingClientRect();
    const pillRect = pill.getBoundingClientRect();
    setIndicator({
      left: pillRect.left - navRect.left + nav.scrollLeft,
      width: pillRect.width,
    });
  }, [activeHref, items]);

  return (
    <nav
      ref={navRef}
      aria-label={label}
      className={cx(
        "scroll-x-bare relative flex w-fit max-w-full items-center gap-1 rounded-full bg-sheet-3 p-1",
        className,
      )}
    >
      {indicator ? (
        <span
          aria-hidden
          className="pointer-events-none absolute left-0 top-1 bottom-1 rounded-full bg-ink transition-[transform,width] duration-200 ease-[cubic-bezier(0.2,0.85,0.3,1)] motion-reduce:transition-none"
          style={{
            width: indicator.width,
            transform: `translateX(${indicator.left}px)`,
          }}
        />
      ) : null}
      {items.map((item) => {
        const active = item.href === activeHref;
        return (
          <Link
            key={item.href}
            ref={(el) => {
              pillRefs.current[item.href] = el;
            }}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cx(
              "relative z-10 shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors sm:px-4",
              active
                ? "text-sheet"
                : "text-ink-soft hover:bg-sheet hover:text-ink",
            )}
          >
            {item.label}
            {item.badge}
          </Link>
        );
      })}
    </nav>
  );
}
