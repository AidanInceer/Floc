/**
 * Route page (ticket 15). Route and Days are TWO routes over ONE dataset
 * (`day` + `day_event`): Route is the stop-level summary — where we sleep,
 * how many nights, in what order, with transport between stops surfaced —
 * Days is the day-level detail (notes + ordered events per day). Splitting
 * them keeps each page's density sane: a two-week trip is ~5 stops here but
 * 14 day cards on /days. See src/app/trip/[id]/days/page.tsx for the other
 * half of this decision.
 *
 * A stop is derived (src/lib/stops.ts), never stored, so "reordering" a stop
 * means editing which dates it covers — there is no drag-and-drop of stored
 * rows because there is nothing stored to drag. Sheets here don't auto-close
 * on submit (the action is a plain server action, not a client callback) —
 * `revalidatePath` refreshes the list underneath; closing is a manual × for
 * v1.
 */

import {
  submitNewStop,
  submitStopDates,
  submitStopPlace,
  removeStop,
  reorderStops,
  setLegTransport,
} from "./actions";
import { searchPlacesAction } from "../place-actions";
import {
  Menu,
  Sheet,
  SubmitButton,
  ConfirmSubmit,
  menuDangerItemClass,
  menuItemClass,
} from "@/components/client-ui";
import { DateRangePicker } from "@/components/date-range-picker";
import { PlacePicker } from "@/components/place-picker";
import { RouteMap } from "@/components/route-map";
import { StopSpine } from "@/components/stop-spine";
import {
  Badge,
  EmptyState,
  Field,
  Page,
  PageHeader,
  Stack,
} from "@/components/ui";
import { LegTransportPicker } from "@/components/leg-transport-picker";
import { type TransportType } from "@/db/schema";
import { requireTripAccess } from "@/server/access";
import { listRouteDays, transportModesByDay } from "@/server/itinerary";
import { formatDate, fromIsoDate } from "@/lib/dates";
import { deriveStops, placedStops } from "@/lib/stops";

export default async function RoutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const access = await requireTripAccess(id, `/trip/${id}/route`);
  const { trip } = access;

  // Independent of each other, so both go out together — the modes are read
  // off the day events rather than stored on a route (rule 3).
  const [days, transportModes] = await Promise.all([
    listRouteDays(trip.id),
    transportModesByDay(trip.id),
  ]);
  // Only the placed runs are stops here (ticket 137). A trip's undecided days
  // are days without a bed, not a stop called "No overnight place set" — see
  // `placedStops`. This is also what makes Route's numbering agree with the
  // Days calendar's, which has always skipped them.
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
  const hasRealStop = stops.length > 0;

  /**
   * The mode for the leg arriving at stop `i` — the transport event on the
   * FIRST day of that stop, and only that day (ticket 78). Falling back to the
   * previous stop's last day was tried and dropped: on a one-night-per-stop
   * route those are adjacent days, so the same train ended up labelling both
   * the leg it belonged to and the next one. No event on the arrival day →
   * nothing is shown, never a guess.
   */
  const legMode = (i: number): TransportType | null =>
    i === 0 ? null : transportModes.get(stops[i].dayIds[0]) ?? null;

  // Coordinates are looked up here rather than threaded through `deriveStops`,
  // which stays pure and geography-free (ticket 15). A pin keeps its position
  // in the FULL stop list so its number matches the card below it, and a stop
  // whose place has no coordinates — typed free-text, or picked before ticket
  // 12 wired the geocoder — is named in `missing` rather than dropped in
  // silence (CLAUDE.md rule 11).
  const coords = new Map(
    days
      .filter((d) => d.overnightPlaceId !== null && d.lat !== null && d.lng !== null)
      .map((d) => [d.overnightPlaceId!, { lat: d.lat!, lng: d.lng! }]),
  );
  const pinned = [];
  const missing: string[] = [];
  for (const [i, stop] of stops.entries()) {
    if (stop.placeId === null) continue;
    const at = coords.get(stop.placeId);
    if (at) {
      pinned.push({
        no: i + 1,
        name: stop.placeName ?? "Unnamed place",
        // Days, not nights (ticket 69): the badge answers "how long are we
        // here", and the card below it counts days too.
        days: stop.dayIds.length,
        ...at,
      });
    } else {
      missing.push(stop.placeName ?? "Unnamed place");
    }
  }

  const addStopForm = (
    <AddStopForm
      tripId={trip.id}
      tripStart={trip.startDate}
      tripEnd={trip.endDate}
    />
  );

  return (
    <Page wide flush>
      <PageHeader
        title="Route"
        subtitle="Where the group sleeps, in order — the day-by-day detail lives on Days."
        actions={
          <Sheet trigger="Add a stop" title="Add a stop">
            {addStopForm}
          </Sheet>
        }
      />

      {!hasRealStop ? (
        <EmptyState
          title="No stops yet"
          action={
            <Sheet trigger="Add the first stop" title="Add a stop">
              {addStopForm}
            </Sheet>
          }
        />
      ) : (
        <Stack gap={6}>
          {/* gap-6, not gap-4: the map is a picture and the spine is a list,
              and the first stop crowded the frame at the tighter step. */}
          <RouteMap stops={pinned} missing={missing} />
          {/* The spine (ticket 82). Reordering is a real write, not a
              client-side sort — see lib/itinerary.ts. Each stop's body is
              handed over server-rendered; the client component owns only the
              spine, the dragging and the move buttons. */}
          <StopSpine
            onReorder={reorderStops.bind(null, trip.id)}
            items={stops.map((stop, i) => ({
              key: stop.dayIds.join("-"),
              label: stop.placeName ?? "this stop",
              dates: shortRange(stop.startDate, stop.endDate),
              duration: `${stop.dayIds.length} day${stop.dayIds.length === 1 ? "" : "s"}`,
              // The row is what the stop *is* — name, nights, dates. Its three
              // verbs used to sit spread across the right edge as full-size
              // buttons; they're behind the row's triple-dot now, the same
              // shape every other row in the app uses (ticket 125).
              body: (
                <div>
                  <div className="flex items-baseline gap-x-3">
                    <p className="truncate font-display text-base font-semibold leading-none sm:text-lg">
                      {stop.placeName ?? "Unnamed place"}
                    </p>
                    {/* Like the long dates below, the nights count is a
                        desktop luxury: the rail's day pill already sizes the
                        stop, and on a phone this badge is what wrapped the
                        place name onto a second line. */}
                    <span className="hidden sm:block">
                      <Badge tone="marine">
                        {stop.nights} night{stop.nights === 1 ? "" : "s"}
                      </Badge>
                    </span>
                  </div>
                  {/* The dates in full, for the width that has room for them.
                      A phone doesn't: the rail beside this already says
                      "5–16 Aug", and repeating it in longhand is what pushed
                      the row to three lines. */}
                  <p className="mt-1 hidden text-sm text-ink-soft sm:block">
                    {stop.startDate === stop.endDate
                      ? formatDate(stop.startDate)
                      : `${formatDate(stop.startDate)} – ${formatDate(stop.endDate)}`}
                  </p>
                </div>
              ),
              actions: (
                <Menu
                  label={`Actions for ${stop.placeName ?? "this stop"}`}
                  /* The page sheet clips its overflow, so the last stop's
                     panel would be cut off at the paper's edge. */
                  drop={i === stops.length - 1 ? "up" : "down"}
                >
                  <Sheet
                    trigger="Change dates"
                    title="Change these dates"
                    triggerVariant="ghost"
                    triggerClassName={menuItemClass}
                  >
                    <ChangeDatesForm
                      tripId={trip.id}
                      dayIds={stop.dayIds}
                      startDate={stop.startDate}
                      endDate={stop.endDate}
                      tripStart={trip.startDate}
                      tripEnd={trip.endDate}
                    />
                  </Sheet>
                  <Sheet
                    trigger="Change place"
                    title="Change overnight place"
                    triggerVariant="ghost"
                    triggerClassName={menuItemClass}
                  >
                    <ChangePlaceForm tripId={trip.id} dayIds={stop.dayIds} />
                  </Sheet>
                  <form action={removeStop.bind(null, trip.id, stop.dayIds)}>
                    <ConfirmSubmit
                      variant="ghost"
                      className={menuDangerItemClass}
                      message="Remove this stop? The days themselves stay on the itinerary — they just lose their overnight place."
                    >
                      Remove stop
                    </ConfirmSubmit>
                  </form>
                </Menu>
              ),
              // The leg to the NEXT stop: drawn between the two rows, and now
              // settable here rather than only on Days (ticket 82). Its mode
              // is the transport event on the next stop's first day, which is
              // exactly the row `setLegTransport` writes.
              leg:
                i < stops.length - 1 ? (
                  <LegTransportPicker
                    mode={legMode(i + 1)}
                    onSet={setLegTransport.bind(
                      null,
                      trip.id,
                      stops[i + 1].dayIds[0],
                    )}
                  />
                ) : undefined,
            }))}
          />
        </Stack>
      )}
    </Page>
  );
}

/**
 * "12–16 Jun" — the stop's dates as one short mark for the spine's left rail
 * (ticket 82). `formatDate` is still what the row below it uses; this is the
 * glanceable form, and it says as little as it can get away with: the two ends
 * share a month name when they can, and a one-day stop is a single date, not
 * "3–3 Jul" — a range whose ends are the same date is a date.
 */
function shortRange(start: string, end: string) {
  const a = fromIsoDate(start);
  const b = fromIsoDate(end);
  const day = (d: Date) => d.getUTCDate();
  const mon = (d: Date) =>
    d.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" });
  if (start === end) return `${day(a)} ${mon(a)}`;
  return mon(a) === mon(b)
    ? `${day(a)}–${day(b)} ${mon(b)}`
    : `${day(a)} ${mon(a)} – ${day(b)} ${mon(b)}`;
}

/**
 * A stop's dates, for both forms on this page (ticket 87). The calendar is
 * scoped to the trip's own window, so a stop can't be dated into a month the
 * trip doesn't cover.
 *
 * When the trip has no dates there is no window to bound the grid with, and
 * rule 9 says undated is a normal state, not an error — so the picker runs
 * unbounded rather than the form blocking on "set the trip dates first". A
 * group that knows it's in Lisbon before it knows which week can still say so.
 * It used to fall back to two native date inputs here; ticket 128 made the
 * bounds optional, which left the fallback with nothing to do.
 */
function StopDatesField({
  tripStart,
  tripEnd,
  startDate,
  endDate,
}: {
  tripStart: string | null;
  tripEnd: string | null;
  startDate?: string;
  endDate?: string;
}) {
  return (
    <Field label="Dates">
      <DateRangePicker
        startName="startDate"
        endName="endDate"
        min={tripStart ?? undefined}
        max={tripEnd ?? undefined}
        defaultStart={startDate}
        defaultEnd={endDate}
        openMonth={tripStart ?? undefined}
      />
    </Field>
  );
}

function AddStopForm({
  tripId,
  tripStart,
  tripEnd,
}: {
  tripId: number;
  /** The trip's own window (rule 9: both null is a normal state). */
  tripStart: string | null;
  tripEnd: string | null;
}) {
  return (
    <form action={submitNewStop.bind(null, tripId)}>
      <Stack gap={3}>
        <PlacePicker name="place" label="Place" search={searchPlacesAction} />
        <StopDatesField
          tripStart={tripStart}
          tripEnd={tripEnd}
          startDate={tripStart ?? undefined}
          endDate={tripStart ?? undefined}
        />
        <SubmitButton>Add stop</SubmitButton>
      </Stack>
    </form>
  );
}

/**
 * Re-dates a stop in place. Re-dating IS how a stop moves — a stop is derived
 * from consecutive days sharing an overnight place, so there are no stored
 * rows to drag and no "order" field to edit (rule 3). The dates the stop
 * currently covers are pre-filled, so nudging one night off the end is two
 * clicks.
 */
function ChangeDatesForm({
  tripId,
  dayIds,
  startDate,
  endDate,
  tripStart,
  tripEnd,
}: {
  tripId: number;
  dayIds: number[];
  startDate: string;
  endDate: string;
  tripStart: string | null;
  tripEnd: string | null;
}) {
  return (
    <form action={submitStopDates.bind(null, tripId, dayIds)}>
      <Stack gap={3}>
        <StopDatesField
          tripStart={tripStart}
          tripEnd={tripEnd}
          startDate={startDate}
          endDate={endDate}
        />
        {/* Ticket 88: the walkthrough went; this line stays because it names a
            consequence on OTHER stops that the form doesn't show. */}
        <p className="text-xs text-ink-faint">
          Dates already covered by the stop either side are taken over by this
          one.
        </p>
        <SubmitButton>Save dates</SubmitButton>
      </Stack>
    </form>
  );
}

function ChangePlaceForm({ tripId, dayIds }: { tripId: number; dayIds: number[] }) {
  return (
    <form action={submitStopPlace.bind(null, tripId, dayIds)}>
      <Stack gap={3}>
        <PlacePicker name="place" label="New place" search={searchPlacesAction} />
        <SubmitButton>Save</SubmitButton>
      </Stack>
    </form>
  );
}
