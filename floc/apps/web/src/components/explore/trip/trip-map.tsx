"use client";

import type { PresetTrip } from "@floc/core/trip/explore/preset-trips";

import { PassMap } from "@/components/explore/outline/pass-map";

/** The listing's route on the outline of its countries, drawn as on Explore: no tiles and no map provider. */
export function TripMap({ trip }: { trip: PresetTrip }) {
  return (
    <div className="aspect-[4/3] overflow-hidden rounded-lg border border-rule bg-sheet-2">
      <PassMap trip={trip} />
    </div>
  );
}
