"use client";

import { formatMoney } from "@floc/core/money/money";
import type { PresetTrip } from "@floc/core/trip/explore/preset-trips";
import type { ReactNode } from "react";

import { skinFor } from "@/components/explore/listing";
import { OutlineMap } from "@/components/explore/outline/outline-map";
import { cx } from "@/components/system/ui";

export const tagClass = "typed w-fit max-w-full truncate rounded-sm px-2 py-1";

const nightsOf = (n: number) => `${n} ${n === 1 ? "night" : "nights"}`;

/**
 * One listing as a tile: its outline map, then what it is. The children say how it fits what you asked for.
 * The footer sits under the tile's own button, so it can hold a second action.
 */
export function ExploreTile({
  trip,
  onPick,
  children,
  footer,
}: {
  trip: PresetTrip;
  onPick: (presetId: string) => void;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="lift flex h-full flex-col overflow-hidden rounded-md bg-sheet shadow-[var(--shadow)]">
      <button type="button" onClick={() => onPick(trip.id)} className="flex w-full flex-col text-left">
        <span aria-hidden className="pointer-events-none block aspect-[24/17] w-full bg-sheet-2">
          <OutlineMap trip={trip} size="tile" />
        </span>
        <span className="flex flex-col gap-1 px-3.5 pb-2 pt-3">
          <span className={cx(tagClass, skinFor(trip), "mb-1")}>{trip.country}</span>
          <b className="font-display text-base font-semibold leading-tight tracking-[-0.02em]">{trip.title}</b>
          <span className="nums text-[11.5px] text-ink-faint">
            {nightsOf(trip.nights)} · {formatMoney(trip.priceFromMinor, trip.currency)}
          </span>
          {children}
        </span>
      </button>
      {footer ? <div className="mt-auto px-3.5 pb-3.5">{footer}</div> : null}
    </div>
  );
}
