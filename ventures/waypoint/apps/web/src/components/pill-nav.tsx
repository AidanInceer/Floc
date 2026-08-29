"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

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
  const [edges, setEdges] = useState({ start: false, end: false });

  const activeHref =
    items.find(
      (item) =>
        pathname === item.href || pathname.startsWith(`${item.href}/`),
    )?.href ?? null;

  const measure = useCallback(() => {
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
  }, [activeHref]);

  /**
   * A scrolling track with no visible scrollbar looks like a track that fits
   * (ticket 219 added a sixth trip tab, so it stops fitting on a phone). Fade
   * whichever end still has pills behind it — the one affordance that says
   * "there's more this way" without printing an instruction (ticket 209).
   */
  const measureEdges = useCallback(() => {
    const nav = navRef.current;
    if (!nav) return;
    const slack = nav.scrollWidth - nav.clientWidth;
    setEdges({
      start: nav.scrollLeft > 1,
      end: slack > 1 && nav.scrollLeft < slack - 1,
    });
  }, []);

  useIsoLayoutEffect(measure, [measure, items]);
  useIsoLayoutEffect(measureEdges, [measureEdges, items]);

  // The pill positions shift whenever the bar reflows — the trip header goes
  // from a stacked mobile row to a centred desktop grid, the pills wrap, a font
  // loads late. A one-shot measure left the ink pill stranded under the wrong
  // tab after any width change (prod bug); re-measure on every nav resize.
  useEffect(() => {
    const nav = navRef.current;
    if (!nav || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      measure();
      measureEdges();
    });
    observer.observe(nav);
    return () => observer.disconnect();
  }, [measure, measureEdges]);

  const fade = edgeMask(edges);

  return (
    <nav
      ref={navRef}
      aria-label={label}
      onScroll={measureEdges}
      style={fade ? { maskImage: fade, WebkitMaskImage: fade } : undefined}
      className={cx(
        "scroll-x-bare relative flex w-fit max-w-full items-center gap-0.5 rounded-full bg-sheet-3 p-0.5 sm:gap-1 sm:p-1",
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
              "relative z-10 shrink-0 rounded-full px-1 py-1.5 text-[13px] font-medium transition-colors sm:px-4 sm:text-sm",
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

const FADE = "1.75rem";

// `black`/`transparent` here are mask *channels*, not paint — a mask reads only
// the alpha, so no token exists or belongs. Nothing on screen takes this colour.

function edgeMask({ start, end }: { start: boolean; end: boolean }): string | null {
  if (!start && !end) return null;
  const stops = [
    start ? `transparent 0, black ${FADE}` : "black 0",
    end ? `black calc(100% - ${FADE}), transparent 100%` : "black 100%",
  ];
  return `linear-gradient(to right, ${stops.join(", ")})`;
}
