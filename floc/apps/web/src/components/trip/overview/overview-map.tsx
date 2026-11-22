import type { LegLine } from "@floc/core/trip/overview/leg-route";
import type { OverviewRoute } from "@floc/core/trip/overview/route";
import type { TripColor } from "@floc/core/trip/trip-color";
import { OverviewGlobe } from "@/components/trip/overview/globe/overview-globe";
import { GoogleRouteMap } from "@/components/trip/overview/google/google-route-map";
import type { GoogleMapsConfig } from "@/lib/maps/google-maps-config";

export function OverviewMap({
  route,
  tone,
  google = null,
  lines = null,
}: {
  route: OverviewRoute;
  tone: TripColor;
  google?: GoogleMapsConfig | null;
  lines?: Promise<(LegLine | null)[]> | null;
}) {
  const unpinned = route.missing.length > 0 ? <Unpinned names={route.missing} /> : null;
  if (route.stops.length === 0) {
    return (
      <div className="flex min-h-[12rem] flex-col sm:min-h-[22rem] items-center justify-center gap-4 p-8 text-center">
        {route.missing.length > 0 ? (
          unpinned
        ) : (
          <p className="max-w-xs text-sm text-ink-soft">No stops yet</p>
        )}
      </div>
    );
  }

  const label = `The route: ${route.stops.map((s) => s.place).join(", ")}`;
  const paper = <OverviewGlobe route={route} tone={tone} label={label} />;
  const onGoogle = Boolean(google && lines);
  const noteEdge = onGoogle ? "top-3" : "bottom-3";
  return (
    <div className="relative h-[14rem] overflow-hidden rounded-t-md sm:h-[28rem] lg:absolute lg:inset-0 lg:h-auto lg:rounded-b-none">
      {onGoogle && google && lines ? <GoogleRouteMap config={google} route={route} lines={lines} label={label} fallback={paper} /> : paper}
      {unpinned ? <div className={`absolute ${noteEdge} left-3 max-w-[calc(100%-1.5rem)] lg:max-w-[calc(100%-26.5rem)]`}>{unpinned}</div> : null}
    </div>
  );
}

function Unpinned({ names }: { names: string[] }) {
  return (
    <p className="rounded-md bg-sheet px-3 py-1.5 text-xs text-ink-soft shadow-card ring-1 ring-rule">
      Not on the map, no coordinates: {names.join(", ")}.
    </p>
  );
}
