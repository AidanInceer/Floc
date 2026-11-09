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

const nightsOf = (n: number) => `${n} ${n === 1 ? "night" : "nights"}`;

/**
 * One listing as a tile: its outline map, then what it is. The children say how it fits what you asked for.
 * The tile opens the listing's own page, or `href`; the footer sits under that link, so it can hold a second action.
 * The link stretches over the whole card (#467); the heart and the footer's controls sit above it, so a tap on them never opens the page.
 */
export function ExploreTile({
  trip,
  children,
  footer,
  href,
}: {
  trip: PresetTrip;
  href?: string;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  const rates = useListingRates();
  return (
    <div className="lift relative flex h-full flex-col overflow-hidden rounded-md bg-sheet shadow-[var(--shadow)]">
      <Link href={href ?? `/explore/${trip.id}`} className="flex w-full flex-col text-left text-ink after:absolute after:inset-0 after:content-['']">
        <span aria-hidden className="pointer-events-none block aspect-[24/17] w-full bg-sheet-2">
          <OutlineMap trip={trip} size="tile" />
        </span>
        <span className="flex flex-col gap-1 px-3.5 pb-2 pt-3">
          <span className={cx(tagClass, skinFor(trip), "mb-1")}>{trip.country}</span>
          <b className="font-display text-base font-semibold leading-tight tracking-[-0.02em]">{trip.title}</b>
          <span className="nums text-[11.5px] text-ink-faint">
            {nightsOf(trip.nights)} · {listingPrice(trip, rates)}
          </span>
          {children}
        </span>
      </Link>
      <SaveHeart presetId={trip.id} title={trip.title} className="absolute right-2.5 top-2.5 z-10" />
      {footer ? <div className="pointer-events-none relative z-10 mt-auto px-3.5 pb-3.5 [&_a]:pointer-events-auto [&_button]:pointer-events-auto">{footer}</div> : null}
    </div>
  );
}
