/**
 * The route, drawn on Overview (ticket 142).
 *
 * Route was a tab until ticket 83 gave Days the overnight place: once the
 * calendar owns where the group sleeps, this has nothing left to edit and
 * becomes a drawing of what Days already says. So it moved here — and moved
 * *whole*: the map keeps its treatment (hollow numbered pins with day-count
 * pills, ticket 69; click-to-arm scroll zoom, ticket 77; the figcaption that
 * names only stops with no coordinates, ticket 79).
 *
 * Three things this deliberately is not:
 *
 * 1. **It is not editable, and there is no reorder gesture.** The order is
 *    whatever the calendar says; swapping two stops means repainting them on
 *    Days. That cost was accepted in ticket 83. The stop spine (tickets 82,
 *    92) was both the drawing of the order and the thing you dragged — without
 *    the drag, the list beside the map is the drawing alone.
 * 2. **It is at the foot of the page**, below Unresolved, prototyped against
 *    two alternatives (a band under the hero, and the map as a full-bleed
 *    hero). Overview is a "what's outstanding" dashboard first and a reference
 *    drawing second, and this is the one placement that leaves the hero
 *    (ticket 89) and the page's shape alone.
 * 3. **It renders nothing at all when no day has an overnight place** — which
 *    is every undated trip, since the itinerary begins when the dates do
 *    (ticket 83). Not an empty state and never a lock (rules 4 and 9): the
 *    hero one screen up already says the dates aren't set, and a second
 *    notice here would be the same absence announced twice.
 */
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

  /**
   * Coordinates are looked up here rather than inside `deriveStops`, which
   * stays pure and geography-free. A pin keeps its position in the full stop
   * list so its number matches the row beside it, and a stop whose place has
   * no coordinates is named in `missing` rather than dropped in silence
   * (rule 11).
   */
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
        // Days, not nights (ticket 69): the pill answers "how long are we
        // here", and the row beside it counts days too.
        days: stop.dayIds.length,
        ...at,
      });
    } else {
      missing.push(stop.placeName ?? "Unnamed place");
    }
  }

  /**
   * The mode for the leg arriving at stop `i` — the transport event on the
   * FIRST day of that stop, and only that day (ticket 78). The previous stop's
   * last day was tried and dropped: on a one-night-per-stop route those are
   * adjacent days, so the same train labelled two legs. No event on the
   * arrival day → nothing is drawn, never a guess.
   */
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
              {/* The leg sits above the stop it arrives at, so a mode always
                  reads as "how we got here" and never as "how we leave". */}
              {i > 0 ? <Leg mode={legMode(i)} /> : null}
              <div className="flex items-start gap-2.5 py-1.5">
                {/* The same ring of pen as the map's pins, at the same number:
                    the row and the pin are one stop drawn twice. */}
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

/**
 * The line between two stops. It draws itself whether or not the mode is
 * known — the gap between two places is a fact of the itinerary, and only the
 * label is missing — and the mode is always spelled out beside its glyph,
 * because `other` has no drawing at all (ticket 78).
 */
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
