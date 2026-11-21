import type { OverviewRoute } from "@floc/core/trip/overview/route";
import type { TripColor } from "@floc/core/trip/trip-color";
import { OverviewGlobe } from "@/components/trip/overview/globe/overview-globe";

export function OverviewMap({
  route,
  tone,
}: {
  route: OverviewRoute;
  tone: TripColor;
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

  return (
    <div className="relative h-[14rem] overflow-hidden rounded-t-md sm:h-[28rem] lg:absolute lg:inset-0 lg:h-auto lg:rounded-b-none">
      <OverviewGlobe route={route} tone={tone} label={`The route: ${route.stops.map((s) => s.place).join(", ")}`} />
      {unpinned ? <div className="absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] lg:max-w-[calc(100%-26.5rem)]">{unpinned}</div> : null}
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
