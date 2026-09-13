// Route, drawn on Overview (ticket 142) — moved here whole from its own tab
// once ticket 83 gave Days the overnight place, leaving nothing left to edit.
//
// Deliberately not: editable/reorderable (order comes from the calendar,
// ticket 83); a hero element (sits at the foot of the page, below Unresolved,
// per ticket 89); rendered at all when no day has an overnight place (every
// undated trip — not an empty state or a lock, rules 4/9, the hero already
// says dates aren't set).
import { ButtonLink } from "@/components/system/ui";

import type { TransportType } from "@/db/schema";
import type { RouteDay } from "@/server/itinerary/itinerary";
import { formatDate } from "@floc/core/dates/dates";
import { deriveStops, placedStops } from "@floc/core/itinerary/stops";
import { RouteMap } from "@/components/map/route-map";
import { TravelModeIcon } from "@/components/map/travel-mode-icon";

export function TripRoute({
  tripId,
  days,
  transportModes,
}: {
  tripId: number;
  days: RouteDay[];
  /** Each day's travel mode, by day id — read off `day_event` (rule 3). */
  transportModes: Map<number, TransportType>;
}) {
  // Only the placed runs are stops (ticket 137): a run of undecided days is an
  // absence of a stop, not a stop called "No overnight place set".
  const stops = placedStops(
    deriveStops(
      days.map((d) => ({
        dayId: d.dayId,
        date: d.date,
        overnightPlaceId: d.overnightPlaceId,
        overnightPlaceName: d.placeName,
      })),
    ),
  );
  // Nothing placed yet (a new or undated trip). The panel stays — an empty
  // left column read as a broken layout — and says the one thing a drawing
  // can't (what's missing) plus where to fix it (rule 11).
  if (stops.length === 0) {
    return (
      <section className="flex flex-1 flex-col rounded-lg bg-sheet p-6 ring-1 ring-rule">
        <h2 className="font-display text-lg">The route</h2>
        <div className="mt-4 flex flex-1 flex-col items-center justify-center rounded-md bg-sheet-2 p-8 text-center">
          <p className="text-sm text-ink-soft">
            No stops yet — the map fills in as the group decides where to stay.
          </p>
          <ButtonLink
            href={`/trip/${tripId}/days`}
            variant="primary"
            className="mt-4"
          >
            Plan the days
          </ButtonLink>
        </div>
      </section>
    );
  }

  // Looked up here, not in deriveStops, which stays pure/geography-free. A
  // missing-coordinate stop is named in `missing` rather than dropped silently (rule 11).
  const coords = new Map(
    days
      .filter(
        (d) => d.overnightPlaceId !== null && d.lat !== null && d.lng !== null,
      )
      .map((d) => [d.overnightPlaceId!, { lat: d.lat!, lng: d.lng! }]),
  );
  const pinned = [];
  const missing: string[] = [];
  for (const [i, stop] of stops.entries()) {
    const at = stop.placeId === null ? undefined : coords.get(stop.placeId);
    if (at) {
      pinned.push({
        no: i + 1,
        name: stop.placeName ?? "Unnamed place",
        days: stop.dayIds.length, // days, not nights (ticket 69)
        ...at,
      });
    } else {
      missing.push(stop.placeName ?? "Unnamed place");
    }
  }

  // Mode for the leg arriving at stop `i`: the event on its FIRST day only
  // (ticket 78) — using the previous stop's last day double-labelled adjacent legs.
  const legMode = (i: number): TransportType | null =>
    transportModes.get(stops[i].dayIds[0]) ?? null;

  return (
    // White panel (ticket 207). The map is the one element on Overview with
    // real colour of its own; a blush fill behind it clashed with the tiles,
    // so the box the map sits in is now the same white as every other panel.
    <section className="flex flex-1 flex-col rounded-lg bg-sheet p-6 ring-1 ring-rule">
      {/* One heading, not an eyebrow over a title saying the same thing. */}
      <h2 className="font-display text-lg">The route</h2>
      <div className="mt-4 flex flex-1 flex-col gap-4">
        <RouteMap stops={pinned} missing={missing} />
        <ol className="rounded-md bg-sheet-2 p-3 text-ink">
          {stops.map((stop, i) => (
            <li key={stop.dayIds.join("-")}>
              {i > 0 ? <Leg mode={legMode(i)} /> : null}
              <div className="flex items-start gap-2.5 py-1.5">
                {/* Same ring/number as the map's pins — row and pin are one stop drawn twice. */}
                {/* The ring keeps the map's pin colour; the place name is
                    plain ink, like every other name in the app. */}
                <span
                  aria-hidden="true"
                  className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 border-pen font-mono text-[10px] font-bold text-pen"
                >
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-display text-[15px] font-semibold leading-tight">
                    {stop.placeName ?? "Unnamed place"}
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] text-ink-soft">
                    {stop.startDate === stop.endDate
                      ? formatDate(stop.startDate)
                      : `${formatDate(stop.startDate)} – ${formatDate(stop.endDate)}`}{" "}
                    · {stop.dayIds.length} day
                    {stop.dayIds.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// Draws even without a known mode — the gap is a fact of the itinerary. Mode
// is always spelled out beside its glyph since `other` has no icon (ticket 78).
function Leg({ mode }: { mode: TransportType | null }) {
  return (
    <div className="flex items-center gap-1.5 pl-2.5 opacity-75">
      <span
        aria-hidden="true"
        className="h-4 w-0.5 shrink-0 bg-current opacity-40"
      />
      {mode ? (
        <span className="inline-flex items-center gap-1 font-mono text-[10.5px] uppercase tracking-[0.06em]">
          <TravelModeIcon mode={mode} />
          {mode}
        </span>
      ) : null}
    </div>
  );
}
