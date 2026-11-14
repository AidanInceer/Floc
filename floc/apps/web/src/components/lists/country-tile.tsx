"use client";

import { listingsIn, regionOf } from "@floc/core/trip/explore/listing-countries";
import Link from "next/link";
import type { ReactNode } from "react";

import { footLineClass, lastLineClass } from "@/components/explore/all/explore-tile";
import { regionLand } from "@/components/explore/listing";
import { heartClass } from "@/components/explore/save/save-heart";
import { ReactionGlyph } from "@/components/system/icons/reaction";
import { cx } from "@/components/system/ui";

import { CountryOutline } from "./country-outline";
import { StartTripButton } from "./start-trip-button";
import { countWord } from "@floc/core/text/count-word";

const PLAIN_LAND = "fill-sheet-2 stroke-rule-strong";

const exploreTrips = (n: number) => (n === 0 ? "No Explore trips" : countWord(n, "Explore trip"));

/**
 * A want-to-go country as a compact tile (#467): its outline in its continent's colour, its name, then how many Explore trips
 * go there beside Start trip. It opens Explore searched for it; its heart takes it off the list and off the globe's yellow (ADR-042).
 * On a friend's list it has no heart, since the country is theirs to drop, not yours (#544).
 */
export function CountryTile({
  code,
  name,
  onDrop,
  children,
  startHref,
  footer,
}: {
  code: string;
  name: string;
  onDrop?: () => void;
  children?: ReactNode;
  /** Where Start trip goes when not the plain Saved path: a wish list asks its people along (#623). */
  startHref?: string;
  footer?: ReactNode;
}) {
  const region = regionOf(code);
  return (
    <div className="lift relative flex h-full flex-col overflow-hidden rounded-md bg-sheet shadow-[var(--shadow)]">
      <Link href={`/explore?country=${code}`} className="flex w-full flex-col text-left text-ink after:absolute after:inset-0 after:content-['']">
        <span aria-hidden className="pointer-events-none block aspect-[4/3] w-full bg-sheet-2">
          <CountryOutline code={code} name={name} fill={region ? regionLand(region) : PLAIN_LAND} />
        </span>
        <span className="px-3 pb-0.5 pt-2.5 text-sm font-semibold leading-tight">{name}</span>
        {children ? <span className="px-3 pt-1.5">{children}</span> : null}
      </Link>
      {onDrop ? (
        <button
          type="button"
          aria-pressed
          aria-label={`Saved ${name}`}
          title="Saved"
          onClick={onDrop}
          className={cx(heartClass, "absolute right-2 top-2 z-10 text-red")}
        >
          <ReactionGlyph kind="heart" mine size={16} />
        </button>
      ) : null}
      <div className={cx(lastLineClass, "px-3", footer ? "pb-1.5" : "pb-2.5")}>
        <span className="nums whitespace-nowrap text-[11px] text-ink-faint">{exploreTrips(listingsIn(code).length)}</span>
        <StartTripButton saved={{ kind: "country", name }} name={name} href={startHref} />
      </div>
      {footer ? <div className={cx(footLineClass, "px-3 pb-2.5")}>{footer}</div> : null}
    </div>
  );
}
