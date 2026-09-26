"use client";

import { formatMoney } from "@floc/core/money/money";
import { fitCheck } from "@floc/core/trip/explore/explore-fit";
import type { ExploreAnswers } from "@floc/core/trip/explore/explore-match";
import type { PresetTrip } from "@floc/core/trip/explore/preset-trips";
import dynamic from "next/dynamic";
import { useMemo } from "react";

import { routeStops } from "@/components/explore/listing";

const RouteMap = dynamic(() => import("@/components/map/route-map").then((m) => m.RouteMap), {
  ssr: false,
  loading: () => <div className="h-full bg-sheet-2" />,
});

const tick = (
  <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="m3 7.5 2.5 2.5L11 4.5" />
  </svg>
);

function BestTile({ trip, rank, answers, onPick }: { trip: PresetTrip; rank: number; answers: ExploreAnswers; onPick: (presetId: string) => void }) {
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
          {fitCheck(trip, answers).fits.map((f) => (
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

export function ExploreBest({
  trips,
  answers,
  onPick,
}: {
  trips: PresetTrip[];
  answers: ExploreAnswers;
  onPick: (presetId: string) => void;
}) {
  return (
    <section className="mt-11">
      <h2 className="mb-5 text-[clamp(1.6rem,3vw,2.3rem)] tracking-[-0.03em]">
        Best fits <span className="nums text-ink-faint">{trips.length}</span>
      </h2>
      {trips.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-rule-strong p-6 text-ink-soft">Nothing fits all of that. Loosen one answer.</p>
      ) : (
        <ol className="grid gap-4 md:grid-cols-3">
          {trips.map((trip, i) => (
            <li key={trip.id}>
              <BestTile trip={trip} rank={i + 1} answers={answers} onPick={onPick} />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
