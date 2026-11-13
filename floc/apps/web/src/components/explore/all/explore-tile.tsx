"use client";

import type { PresetTrip } from "@floc/core/trip/explore/preset-trips";
import Link from "next/link";
import type { ReactNode } from "react";

import { skinFor } from "@/components/explore/listing";
import { SaveHeart } from "@/components/explore/save/save-heart";
import { OutlineMap } from "@/components/explore/outline/outline-map";
import { cx } from "@/components/system/ui";
import { listingPrice } from "@floc/core/trip/explore/listing-price";
import { useListingRates } from "@/components/explore/listing-rates";

export const tagClass = "typed w-fit max-w-full truncate rounded-sm px-2 py-1";

/** The line under a tile's last line (#623): the same layer, without pushing itself down. */
export const footLineClass =
  "pointer-events-none relative z-10 flex items-center justify-between gap-2 [&_a]:pointer-events-auto [&_button]:pointer-events-auto";

/** A tile's last line when it holds an action (#467): figures on the left, the action on the right, both above the stretched link. */
export const lastLineClass =
  "pointer-events-none relative z-10 mt-auto flex items-center justify-between gap-2 [&_a]:pointer-events-auto [&_button]:pointer-events-auto";

const nightsOf = (n: number) => `${n} ${n === 1 ? "night" : "nights"}`;

/**
 * One listing as a tile: its outline map, then what it is. The children say how it fits what you asked for.
 * The tile opens the listing's own page, or `href`; the footer sits under that link, so it can hold a second action.
 * The link stretches over the whole card (#467); the heart and the footer's controls sit above it, so a tap on them never opens the page.
 * An `action` takes the right end of the last line, and the figures move down beside it.
 */
export function ExploreTile({
  trip,
  children,
  footer,
  action,
  href,
}: {
  trip: PresetTrip;
  href?: string;
  children?: ReactNode;
  footer?: ReactNode;
  action?: ReactNode;
}) {
  const rates = useListingRates();
  const figures = (
    <span className="nums text-[11px] text-ink-faint">
      {nightsOf(trip.nights)} · {listingPrice(trip, rates)}
    </span>
  );
  return (
    <div className="lift relative flex h-full flex-col overflow-hidden rounded-md bg-sheet shadow-[var(--shadow)]">
      <Link href={href ?? `/explore/${trip.id}`} className="flex w-full flex-col text-left text-ink after:absolute after:inset-0 after:content-['']">
        <span aria-hidden className="pointer-events-none block aspect-[24/17] w-full bg-sheet-2">
          <OutlineMap trip={trip} size="tile" />
        </span>
        <span className={cx("flex flex-col gap-1 px-3.5 pt-3", action ? "pb-1.5" : "pb-2")}>
          <span className={cx(tagClass, skinFor(trip), "mb-1")}>{trip.country}</span>
          <b className="font-display text-base font-semibold leading-tight tracking-[-0.02em]">{trip.title}</b>
          {action ? null : figures}
          {children}
        </span>
      </Link>
      <SaveHeart presetId={trip.id} title={trip.title} className="absolute right-2.5 top-2.5 z-10" />
      {action ? (
        <div className={cx(lastLineClass, "px-3.5", footer ? "pb-1.5" : "pb-3.5")}>
          {/* Why: beside an action on a phone the figures stack, nights over price, rather than wrap at the dot. */}
          <span className="nums flex flex-col text-[11px] text-ink-faint sm:flex-row sm:gap-1">
            <span className="whitespace-nowrap">{nightsOf(trip.nights)}<span className="max-sm:hidden"> ·</span></span>
            <span className="whitespace-nowrap">{listingPrice(trip, rates)}</span>
          </span>
          {action}
        </div>
      ) : null}
      {footer ? <div className={cx("pointer-events-none relative z-10 px-3.5 pb-3.5 [&_a]:pointer-events-auto [&_button]:pointer-events-auto", !action && "mt-auto")}>{footer}</div> : null}
    </div>
  );
}
