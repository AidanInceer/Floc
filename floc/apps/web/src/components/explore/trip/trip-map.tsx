"use client";

import type { PresetTrip } from "@floc/core/trip/explore/preset-trips";

import { PassMap } from "@/components/explore/outline/pass-map";

export function TripMap({ trip }: { trip: PresetTrip }) {
  return (
    <div className="aspect-[4/3] overflow-hidden rounded-md border border-rule bg-sheet-2">
      <PassMap trip={trip} />
    </div>
  );
}
