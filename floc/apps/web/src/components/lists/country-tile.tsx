"use client";

import { listingsIn, regionOf } from "@floc/core/trip/explore/listing-countries";
import Link from "next/link";

import { tagClass } from "@/components/explore/all/explore-tile";
import { regionLand, regionSkin } from "@/components/explore/listing";
import { heartClass } from "@/components/explore/save/save-heart";
import { ReactionGlyph } from "@/components/system/icons/reaction";
import { cx } from "@/components/system/ui";

import { CountryOutline } from "./country-outline";

const PLAIN_LAND = "fill-sheet-2 stroke-rule-strong";
const PLAIN_TAG = "border border-rule-strong text-ink-soft";

/**
 * A want-to-go country drawn as an Explore tile (#467): its outline, its country tag, then what it is and how many trips go there.
 * It opens Explore searched for it; its heart takes it off the list, and off the globe's yellow (ADR-042).
 */
export function CountryTile({ code, name, onDrop }: { code: string; name: string; onDrop: () => void }) {
  const region = regionOf(code);
  const count = listingsIn(code).length;
  return (
    <div className="lift relative flex h-full flex-col overflow-hidden rounded-md bg-sheet shadow-[var(--shadow)]">
      <Link href={`/explore?country=${code}`} className="flex w-full flex-col text-left text-ink">
        <span aria-hidden className="pointer-events-none block aspect-[24/17] w-full bg-sheet-2">
          <CountryOutline code={code} name={name} fill={region ? regionLand(region) : PLAIN_LAND} />
        </span>
        <span className="flex flex-col gap-1 px-3.5 pb-3.5 pt-3">
          <span className={cx(tagClass, region ? regionSkin(region) : PLAIN_TAG, "mb-1 !whitespace-normal")}>{name}</span>
          <b className="font-display text-base font-semibold leading-tight tracking-[-0.02em]">Want to go</b>
          <span className="nums text-[11.5px] text-ink-faint">
            {count === 0 ? "No trips on Explore yet" : `${count} ${count === 1 ? "trip" : "trips"} on Explore`}
          </span>
        </span>
      </Link>
      <button
        type="button"
        aria-pressed
        aria-label={`Saved ${name}`}
        title="Saved"
        onClick={onDrop}
        className={cx(heartClass, "absolute right-2.5 top-2.5 text-red")}
      >
        <ReactionGlyph kind="heart" mine size={16} />
      </button>
    </div>
  );
}
