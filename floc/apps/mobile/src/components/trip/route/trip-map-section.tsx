import type { Pastel } from "@floc/core/design/pastels";
import type { OverviewRoute } from "@floc/core/trip/overview/route";

import { Body, Card } from "@/components/system/ui";

import { StopsMap } from "./stops-map";

export function TripMapSection({ route, tone }: { route: OverviewRoute; tone: Pastel }) {
  if (route.stops.length === 0 && route.missing.length === 0) return null;
  return (
    <Card>
      {route.stops.length > 0 ? <StopsMap route={route} tone={tone} /> : null}
      {/* The one thing the map cannot show: what is not on it (rule 11). */}
      {route.missing.length > 0 ? <Body tone="ink-2">Not on the map, no coordinates: {route.missing.join(", ")}.</Body> : null}
    </Card>
  );
}
