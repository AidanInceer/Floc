"use client";

import { formatMoney } from "@floc/core/money/money";
import { filterCheck, type ExploreFilter } from "@floc/core/trip/explore/explore-filter";
import type { PresetTrip } from "@floc/core/trip/explore/preset-trips";
import dynamic from "next/dynamic";
import { useMemo } from "react";

import { routeStops } from "@/components/explore/listing";
import { useCardTrack } from "@/components/explore/use-card-track";
import { cx } from "@/components/system/ui";

const RouteMap = dynamic(() => import("@/components/map/route-map").then((m) => m.RouteMap), {
  ssr: false,
  loading: () => <div className="h-full bg-sheet-2" />,
});

const tick = (
  <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="m3 7.5 2.5 2.5L11 4.5" />
  </svg>
);

function PickTile({ trip, rank, filter, onPick }: { trip: PresetTrip; rank: number; filter: ExploreFilter; onPick: (presetId: string) => void }) {
  const stops = useMemo(() => routeStops(trip), [trip]);
  return (
    <button
      type="button"
      onClick={() => onPick(trip.id)}
      className="lift flex h-full w-full flex-col overflow-hidden rounded-[18px] bg-sheet text-left shadow-[var(--shadow)]"
    >
      <span aria-hidden className="pointer-events-none block h-[150px] [&_.route-map-frame]:rounded-none [&_.route-map-frame]:border-0">
        <RouteMap stops={stops} missing={[]} fill still />
      </span>
      <span className="flex flex-col gap-1 px-4 pb-4 pt-3.5">
        <b className="font-display text-lg font-semibold tracking-[-0.02em]">
          <span className="nums mr-2 text-ink-faint">{rank}</span>
          {trip.title}
        </b>
        <span className="nums text-[11.5px] text-ink-faint">
          {trip.country} · {trip.nights} nights · from {formatMoney(trip.priceFromMinor, trip.currency)}
        </span>
        <span className="mt-1.5 flex flex-wrap gap-x-2.5 gap-y-1">
          {filterCheck(trip, filter).fits.map((f) => (
            <span key={f} className="inline-flex items-center gap-1 text-xs text-green">
              {tick}
              {f}
            </span>
          ))}
        </span>
      </span>
    </button>
  );
}

const arrow = (d: string) => (
  <svg width="15" height="15" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);

const step =
  "grid size-9 place-items-center rounded-full border border-rule-strong text-ink-soft transition-colors hover:text-ink disabled:opacity-40 disabled:hover:text-ink-soft";

export function ExploreForYou({
  trips,
  filter,
  onPick,
}: {
  trips: PresetTrip[];
  filter: ExploreFilter;
  onPick: (presetId: string) => void;
}) {
  const { track, edge, dragging, step: page, handlers } = useCardTrack(trips.length);

  return (
    <section className="mt-11" aria-roledescription="carousel" aria-label="For you">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-[clamp(1.6rem,3vw,2.3rem)] tracking-[-0.03em]">For you</h2>
        {trips.length > 1 ? (
          <div className="flex gap-2">
            <button type="button" aria-label="Previous" onClick={() => page(-1)} disabled={edge.start} className={step}>
              {arrow("m8.5 3.5-3.5 3.5 3.5 3.5")}
            </button>
            <button type="button" aria-label="Next" onClick={() => page(1)} disabled={edge.end} className={step}>
              {arrow("m5.5 3.5 3.5 3.5-3.5 3.5")}
            </button>
          </div>
        ) : null}
      </div>
      {trips.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-rule-strong p-6 text-ink-soft">Nothing fits all of that. Widen one slider.</p>
      ) : (
        <ol
          ref={track}
          {...handlers}
          className={cx("scroll-x-bare -mx-2 flex gap-4 px-2 pb-3", dragging ? "cursor-grabbing select-none" : "snap-x snap-mandatory")}
        >
          {trips.map((trip, i) => (
            <li key={trip.id} className="shrink-0 basis-[85%] snap-start sm:basis-[calc((100%-1rem)/2)] md:basis-[calc((100%-2rem)/3)]">
              <PickTile trip={trip} rank={i + 1} filter={filter} onPick={onPick} />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
