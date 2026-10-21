// The hero's map: the route on Explore's globe, behind the card. A leg with no coordinates is named, not dropped (rule 11).
import type { OverviewRoute } from "@floc/core/trip/overview/route";
import type { TripColor } from "@floc/core/trip/trip-color";
import { ButtonLink } from "@/components/system/ui";
import { OverviewGlobe } from "@/components/trip/overview/globe/overview-globe";

export function OverviewMap({
  tripId,
  route,
  tone,
  datesUnset,
}: {
  tripId: number;
  route: OverviewRoute;
  tone: TripColor;
  datesUnset: boolean;
}) {
  const unpinned = route.missing.length > 0 ? <Unpinned names={route.missing} /> : null;
  if (route.stops.length === 0) {
    return (
      <div className="flex min-h-[22rem] flex-col items-center justify-center gap-4 p-8 text-center">
        {route.missing.length > 0 ? (
          unpinned
        ) : (
          <>
            <p className="max-w-xs text-sm text-ink-soft">
              {datesUnset
                ? "No dates yet. Pick them, then say where you sleep each night, and the map fills in."
                : "No stops yet. The map fills in as the group decides where to stay."}
            </p>
            <ButtonLink href={`/trip/${tripId}/${datesUnset ? "dates" : "days"}`} variant="primary">
              {datesUnset ? "Pick the dates" : "Plan the days"}
            </ButtonLink>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative h-[24rem] overflow-hidden rounded-t-xl sm:h-[28rem] lg:absolute lg:inset-0 lg:h-auto lg:rounded-xl">
      <OverviewGlobe route={route} tone={tone} label={`The route: ${route.stops.map((s) => s.place).join(", ")}`} />
      {unpinned ? <div className="absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] lg:max-w-[calc(100%-26.5rem)]">{unpinned}</div> : null}
    </div>
  );
}

function Unpinned({ names }: { names: string[] }) {
  return (
    <p className="rounded-lg bg-sheet px-3 py-1.5 text-xs text-ink-soft shadow-sm ring-1 ring-rule">
      Not on the map, no coordinates: {names.join(", ")}.
    </p>
  );
}
