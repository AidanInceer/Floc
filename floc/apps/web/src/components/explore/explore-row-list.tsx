"use client";

import type { PresetTrip } from "@floc/core/trip/explore/preset-trips";
import { useState } from "react";
import { formatMoney } from "@floc/core/money/money";

import { ExploreRowDrawer } from "@/components/explore/explore-row-drawer";
import { skinFor } from "@/components/explore/listing";
import { cx } from "@/components/system/ui";

export function ExploreRowList({ trips, signedIn, row, tag }: { trips: PresetTrip[]; signedIn: boolean; row: string; tag: string }) {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <>
      {trips.map((trip) => {
        const open = openId === trip.id;
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
              <h3 className="min-w-0 truncate text-base">{trip.title}</h3>
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
