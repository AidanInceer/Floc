import { PRESET_TRIPS } from "@floc/core/trip/explore/preset-trips";
import { useEffect, type RefObject } from "react";

import { drawRoute } from "@/components/explore/atlas/atlas-route";
import type { Box } from "@/components/explore/atlas/tag-place";
import { routeStops } from "@/components/explore/listing";

type Leaflet = typeof import("leaflet");
type View = { paddingTopLeft?: [number, number]; paddingBottomRight?: [number, number] };

const PAUSE_MS = 450;
export const FLY_S = 1.4;
const ROUTE_MAX_ZOOM = 9;
// Why: a stop's tag hangs to its right first; the longest ("Positano, Amalfi, Capri", 3 days) runs about 200px.
const TAG_ROOM = 200;

export const still = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/** After a pause, flies the map to a trip and draws its route; a new pick takes the old route away. */
export function useRouteFlight(
  map: RefObject<import("leaflet").Map | null>,
  leaflet: RefObject<Leaflet | null>,
  route: { id: string; n: number } | null,
  area: { frame: (room?: number) => View; open: () => Box },
) {
  useEffect(() => {
    const live = map.current;
    const L = leaflet.current;
    const trip = route && PRESET_TRIPS.find((t) => t.id === route.id);
    if (!live || !L || !trip) return;
    const stops = routeStops(trip);
    const target = L.latLngBounds(stops.map((s) => [s.lat, s.lng] as [number, number]));
    const calm = still();
    let undraw = () => {};
    const draw = () => {
      undraw = drawRoute(L, live, stops, { still: calm, view: area.open });
    };
    const go = setTimeout(
      () => {
        const view = { ...area.frame(TAG_ROOM), maxZoom: ROUTE_MAX_ZOOM };
        if (calm) {
          live.fitBounds(target, { ...view, animate: false });
          return draw();
        }
        live.once("moveend", draw);
        live.flyToBounds(target, { ...view, duration: FLY_S });
      },
      calm ? 0 : PAUSE_MS,
    );
    return () => {
      clearTimeout(go);
      live.off("moveend", draw);
      undraw();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- a new pick is the only thing that moves the map
  }, [route]);
}
