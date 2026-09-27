"use client";

import { formatMoney } from "@floc/core/money/money";
import { filterCheck, type ExploreFilter } from "@floc/core/trip/explore/explore-filter";
import type { PresetTrip } from "@floc/core/trip/explore/preset-trips";
import { useState } from "react";

import { ExploreRowDrawer } from "@/components/explore/explore-row-drawer";
import { skinFor } from "@/components/explore/listing";
import { cx } from "@/components/system/ui";

export function ExploreRowList({
  trips,
  filter,
  signedIn,
  row,
  tag,
}: {
  trips: PresetTrip[];
  filter: ExploreFilter;
  signedIn: boolean;
  row: string;
  tag: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <>
      {trips.map((trip) => {
        const open = openId === trip.id;
        const { misses } = filterCheck(trip, filter);
        return (
          <li key={trip.id}>
            <button
              type="button"
              onClick={() => setOpenId(open ? null : trip.id)}
              aria-expanded={open}
              aria-controls={`drawer-${trip.id}`}
              className={cx(row, "w-full text-left", open && "bg-sheet")}
            >
              <span className={cx(tag, skinFor(trip))}>{trip.country}</span>
              <span className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="min-w-0 truncate text-base">{trip.title}</h3>
                {misses.length > 0 ? (
                  <span className="hidden flex-wrap gap-1.5 md:inline-flex">
                    {misses.map((m) => (
                      <span key={m} className="rounded-full border border-rule-strong px-2 py-px text-[11.5px] text-ink-faint">
                        {m}
                      </span>
                    ))}
                  </span>
                ) : null}
              </span>
              <span className="nums hidden text-right text-[13px] md:block">{trip.nights}</span>
              <span className="nums hidden text-right text-[13px] md:block">{formatMoney(trip.priceFromMinor, trip.currency)}</span>
              <svg
                width="18"
                height="18"
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
                className={cx("mr-2 text-ink-soft transition-transform", open && "rotate-180")}
              >
                <path d="m3.5 5.5 3.5 3.5 3.5-3.5" />
              </svg>
            </button>
            {open ? (
              <div id={`drawer-${trip.id}`}>
                <ExploreRowDrawer trip={trip} signedIn={signedIn} />
              </div>
            ) : null}
          </li>
        );
      })}
    </>
  );
}
