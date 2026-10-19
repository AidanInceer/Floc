"use client";

import { formatMoney } from "@floc/core/money/money";
import type { PresetTrip } from "@floc/core/trip/explore/preset-trips";
import type { ReactNode } from "react";

import { skinFor } from "@/components/explore/listing";
import { OutlineMap } from "@/components/explore/outline/outline-map";
import { cx } from "@/components/system/ui";

export const tagClass = "typed w-fit max-w-full truncate rounded-md px-2 py-1";

const nightsOf = (n: number) => `${n} ${n === 1 ? "night" : "nights"}`;

/** One listing as a tile: its outline map, then what it is. `children` is the line that says how it fits the group. */
export function ExploreTile({
  trip,
  onPick,
  current = false,
  rank,
  wide = false,
  children,
}: {
  trip: PresetTrip;
  onPick: (presetId: string) => void;
  /** The tile whose pass is open beside the grid. */
  current?: boolean;
  rank?: number;
  /** A tile that is wider than it is tall takes the wider drawing. */
  wide?: boolean;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => onPick(trip.id)}
      aria-current={current ? "true" : undefined}
      className={cx(
        "lift flex h-full w-full flex-col overflow-hidden rounded-[18px] bg-sheet text-left shadow-[var(--shadow)]",
        current && "lg:ring-2 lg:ring-ink",
      )}
    >
      <span aria-hidden className={cx("pointer-events-none block w-full bg-sheet-2", wide ? "aspect-[2/1]" : "aspect-[24/17]")}>
        <OutlineMap trip={trip} size={wide ? "pass" : "tile"} />
      </span>
      <span className="flex flex-col gap-1 px-3.5 pb-3.5 pt-3">
        <span className={cx(tagClass, skinFor(trip), "mb-1")}>{trip.country}</span>
        <b className="font-display text-base font-semibold leading-tight tracking-[-0.02em]">
          {rank ? <span className="nums mr-2 text-ink-faint">{rank}</span> : null}
          {trip.title}
        </b>
        <span className="nums text-[11.5px] text-ink-faint">
          {nightsOf(trip.nights)} · {formatMoney(trip.priceFromMinor, trip.currency)}
        </span>
        {children}
      </span>
    </button>
  );
}
