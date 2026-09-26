// The hero's map: one pin per leg, numbered like the leg rows. A leg with no coordinates is named, not dropped (rule 11).
import type { Leg, LegFile } from "@floc/core/trip/overview/legs";
import type { RouteDay } from "@/server/itinerary/itinerary";
import { RouteMap } from "@/components/map/route-map";
import { ButtonLink } from "@/components/system/ui";

export function OverviewMap({
  tripId,
  legs,
  days,
  datesUnset,
}: {
  tripId: number;
  legs: Leg<LegFile>[];
  days: RouteDay[];
  datesUnset: boolean;
}) {
  if (legs.length === 0) {
    return (
      <div className="flex min-h-[22rem] flex-col items-center justify-center gap-4 rounded-t-xl bg-sheet-2 p-8 text-center lg:rounded-l-xl lg:rounded-tr-none">
        <p className="max-w-xs text-sm text-ink-soft">
          {datesUnset
            ? "No dates yet. Pick them, then say where you sleep each night, and the map fills in."
            : "No stops yet. The map fills in as the group decides where to stay."}
        </p>
        <ButtonLink href={`/trip/${tripId}/${datesUnset ? "dates" : "days"}`} variant="primary">
          {datesUnset ? "Pick the dates" : "Plan the days"}
        </ButtonLink>
      </div>
    );
  }

  const at = new Map(
    days.filter((d) => d.lat !== null && d.lng !== null).map((d) => [d.overnightPlaceId, { lat: d.lat!, lng: d.lng! }]),
  );
  const pinned = [];
  const missing: string[] = [];
  for (const leg of legs) {
    const where = at.get(leg.placeId);
    if (where) pinned.push({ no: leg.no, name: leg.placeName, days: leg.nights, ...where });
    else missing.push(leg.placeName);
  }

  return (
    <div className="min-h-[22rem] overflow-hidden rounded-t-xl lg:rounded-l-xl lg:rounded-tr-none [&_.route-map-frame]:rounded-none">
      <RouteMap stops={pinned} missing={missing} fill />
    </div>
  );
}
