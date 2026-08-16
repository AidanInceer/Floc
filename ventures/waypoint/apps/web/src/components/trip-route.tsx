// Route, drawn on Overview (ticket 142) — moved here whole from its own tab
// once ticket 83 gave Days the overnight place, leaving nothing left to edit.
//
// Deliberately not: editable/reorderable (order comes from the calendar,
// ticket 83); a hero element (sits at the foot of the page, below Unresolved,
// per ticket 89); rendered at all when no day has an overnight place (every
// undated trip — not an empty state or a lock, rules 4/9, the hero already
// says dates aren't set).
import type { TransportType } from "@/db/schema";
import type { RouteDay } from "@/server/itinerary";
import { formatDate } from "@/lib/dates";
import { deriveStops, placedStops } from "@/lib/stops";
import { RouteMap } from "@/components/route-map";
import { TravelModeIcon } from "@/components/travel-mode-icon";

export function TripRoute({
  days,
  transportModes,
}: {
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
  if (stops.length === 0) return null;

  // Looked up here, not in deriveStops, which stays pure/geography-free. A
  // missing-coordinate stop is named in `missing` rather than dropped silently (rule 11).
  const coords = new Map(
    days
      .filter((d) => d.overnightPlaceId !== null && d.lat !== null && d.lng !== null)
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
    <section className="mt-6">
      <h2 className="text-[15px] font-semibold">Where you&rsquo;re going</h2>
      {/* Same 65/35 split as the hero, so the page has one column rule rather
          than two. The list wants far less width than the map and gets it. */}
      <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,65fr)_minmax(0,35fr)] lg:items-start">
        <RouteMap stops={pinned} missing={missing} />
        <ol className="rounded-md border border-rule-strong bg-sheet-2 p-3">
          {stops.map((stop, i) => (
            <li key={stop.dayIds.join("-")}>
              {i > 0 ? <Leg mode={legMode(i)} /> : null}
              <div className="flex items-start gap-2.5 py-1.5">
                {/* Same ring/number as the map's pins — row and pin are one stop drawn twice. */}
                <span
                  aria-hidden="true"
                  className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 border-pen font-mono text-[10px] font-bold text-pen-deep"
                >
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-display text-[15px] font-semibold leading-tight">
                    {stop.placeName ?? "Unnamed place"}
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] text-ink-faint">
                    {stop.startDate === stop.endDate
                      ? formatDate(stop.startDate)
                      : `${formatDate(stop.startDate)} – ${formatDate(stop.endDate)}`}{" "}
                    · {stop.dayIds.length} day{stop.dayIds.length === 1 ? "" : "s"}
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
    <div className="flex items-center gap-1.5 pl-2.5 text-ink-soft">
      <span aria-hidden="true" className="h-4 w-0.5 shrink-0 bg-rule-strong" />
      {mode ? (
        <span className="inline-flex items-center gap-1 font-mono text-[10.5px] uppercase tracking-[0.06em]">
          <TravelModeIcon mode={mode} />
          {mode}
        </span>
      ) : null}
    </div>
  );
}
