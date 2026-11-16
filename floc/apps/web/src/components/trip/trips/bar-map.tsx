import type { OverviewRoute } from "@floc/core/trip/overview/route";
import type { TripColor } from "@floc/core/trip/trip-color";

import { OverviewGlobe } from "@/components/trip/overview/globe/overview-globe";
import { DotMap } from "./dot-map";

export function BarMap({ route, tone }: { route: OverviewRoute | null; tone: TripColor }) {
  if (!route || route.stops.length === 0) {
    return <DotMap label={route && route.missing.length > 0 ? "Not on the map yet" : "No stops yet"} />;
  }
  return <OverviewGlobe quiet route={route} tone={tone} label={`The route: ${route.stops.map((s) => s.place).join(", ")}`} />;
}
