"use client";

import dynamic from "next/dynamic";

import type { RouteMapStop } from "@/components/map/route-map";

const frame = "h-[21rem] lg:h-[27rem]";

// Leaflet touches `window` at import time.
const RouteMap = dynamic(() => import("@/components/map/route-map").then((m) => m.RouteMap), {
  ssr: false,
  loading: () => <div className={`${frame} bg-sheet-2`} />,
});

export function TripMap({ stops }: { stops: RouteMapStop[] }) {
  return (
    <div className={`${frame} overflow-hidden rounded-lg border border-rule`}>
      <RouteMap stops={stops} missing={[]} fill />
    </div>
  );
}
