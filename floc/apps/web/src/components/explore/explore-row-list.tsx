"use client";

import type { PresetTrip } from "@floc/core/trip/explore/preset-trips";
import { useState } from "react";

import { ExploreRowDrawer } from "@/components/explore/explore-row-drawer";
import { skinFor } from "@/components/explore/listing";
import { cx } from "@/components/system/ui";

export function ExploreRowList({ trips, signedIn, row }: { trips: PresetTrip[]; signedIn: boolean; row: string }) {
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
              <span aria-hidden className={cx("size-2.5 rounded-full", skinFor(trip))} />
              <h3 className="text-base">{trip.title}</h3>
              <span className="hidden text-[12.5px] text-ink-soft md:block">{trip.country}</span>
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
