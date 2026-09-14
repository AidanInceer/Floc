"use client";

import { formatMoney } from "@floc/core/money/money";
import type { PresetTrip } from "@floc/core/trip/explore/preset-trips";
import dynamic from "next/dynamic";
import { useMemo } from "react";

import { startTripFromPreset } from "@/app/explore/actions";
import { legLine, routeStops } from "@/components/explore/listing";
import { SubmitButton } from "@/components/system/client-ui";
import { ButtonLink } from "@/components/system/ui";

// Leaflet stays out of the page bundle until a drawer opens.
const RouteMap = dynamic(() => import("@/components/map/route-map").then((m) => m.RouteMap), {
  ssr: false,
  loading: () => <div className="h-[18rem] rounded-md bg-sheet" />,
});

export function ExploreRowDrawer({ trip, signedIn }: { trip: PresetTrip; signedIn: boolean }) {
  const stops = useMemo(() => routeStops(trip), [trip]);
  return (
    <div className="grid gap-5 border-b border-rule bg-sheet px-1 py-4 md:grid-cols-[3fr_2fr]">
      <div className="[&_.route-map-canvas]:!h-[18rem]">
        <RouteMap stops={stops} missing={[]} />
      </div>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-ink-soft">{trip.summary}</p>
        <ol className="ml-1.5 border-l-[1.5px] border-rule-strong">
          {trip.legs.map((leg, i) => (
            <li
              key={`${leg.place}-${i}`}
              className="relative py-0.5 pb-2 pl-4 text-sm before:absolute before:-left-[5px] before:top-2 before:size-2 before:rounded-full before:border-[1.5px] before:border-ink before:bg-sheet"
            >
              {legLine(leg)}
            </li>
          ))}
        </ol>
        <p className="nums text-[13px]">
          {trip.nights} nights · {trip.groupSize} · {formatMoney(trip.priceFromMinor, trip.currency)} pp
        </p>
        <div className="mt-auto">
          {signedIn ? (
            <form action={startTripFromPreset}>
              <input type="hidden" name="presetId" value={trip.id} />
              <SubmitButton pendingLabel="Starting…" className="w-full">
                Start this trip
              </SubmitButton>
            </form>
          ) : (
            <ButtonLink href="/signup" variant="primary" className="w-full">
              Sign up to start
            </ButtonLink>
          )}
        </div>
      </div>
    </div>
  );
}
