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
import { and, asc, eq, isNull } from "drizzle-orm";

import {
  addStop,
  removeStop,
  reorderStops,
  searchPlacesAction,
  setOvernightPlace,
  setStopDates,
} from "./actions";
import {
  DragList,
  Sheet,
  SubmitButton,
  ConfirmSubmit,
} from "@/components/client-ui";
import { DateRangePicker } from "@/components/date-range-picker";
import { PlacePicker } from "@/components/place-picker";
import { RouteMap } from "@/components/route-map";
import {
  Badge,
  Card,
  CardHeader,
  EmptyState,
  Field,
  Input,
  LockedNotice,
  Page,
  PageHeader,
  Stack,
} from "@/components/ui";
import { TravelModeIcon } from "@/components/travel-mode-icon";
// PROTOTYPE ONLY (ticket 82) — both of these leave main with the losing variants.
import { PrototypeSwitcher } from "@/components/prototype-switcher";
import {
  PROTOTYPE_VARIANTS,
  VariantA,
  VariantB,
  VariantC,
} from "./prototype-variants";
import { db } from "@/db";
import { day, dayEvent, place, type TransportType } from "@/db/schema";
import { requireTripAccess } from "@/lib/access";
import { formatDate } from "@/lib/dates";
import { deriveStops } from "@/lib/stops";
import { lockReason } from "@/lib/tabs";

async function loadDays(tripId: number) {
  return db
    .select({
      dayId: day.id,
      date: day.date,
      overnightPlaceId: day.overnightPlaceId,
      placeName: place.name,
      lat: place.lat,
      lng: place.lng,
    })
    .from(day)
    .leftJoin(place, eq(place.id, day.overnightPlaceId))
    .where(and(eq(day.tripId, tripId), isNull(day.deletedAt)))
    .orderBy(asc(day.date))
    .all();
}

/**
 * Transport events, by the day they sit on (ticket 78). The travel mode
 * between two stops is not stored on the route — a stop isn't stored at all
 * (rule 3) — so it is read back off the day events the group already writes on
 * Days. Only the type is needed here; the event itself belongs to Days.
 */
async function loadTransportModes(tripId: number) {
  const rows = await db
    .select({ dayId: dayEvent.dayId, transportType: dayEvent.transportType })
    .from(dayEvent)
    .innerJoin(day, eq(day.id, dayEvent.dayId))
    .where(
      and(
        eq(day.tripId, tripId),
        eq(dayEvent.type, "transport"),
        isNull(dayEvent.deletedAt),
        isNull(day.deletedAt),
      ),
    )
    .orderBy(asc(dayEvent.orderIndex))
    .all();

  const byDay = new Map<number, TransportType>();
  for (const r of rows) {
    // First transport event of the day wins — a day with a taxi to the ferry
    // and then the ferry is one leg to the reader, and the earliest event is
    // the one that starts it.
    if (r.transportType && !byDay.has(r.dayId)) byDay.set(r.dayId, r.transportType);
  }
  return byDay;
}

export default async function RoutePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  /** PROTOTYPE ONLY (ticket 82): `?variant=` picks a throwaway rendering. */
  searchParams?: Promise<{ variant?: string }>;
}) {
  const { id } = await params;
  const variant = (await searchParams)?.variant ?? "A";
  const access = await requireTripAccess(id, `/trip/${id}/route`);
  const { trip } = access;

  if (!trip.routeUnlockedAt) {
    return (
      <Page wide flush>
        <PageHeader title="Route" />
        <LockedNotice reason={lockReason("route") ?? "Not open yet"} />
      </Page>
    );
  }

  const days = await loadDays(trip.id);
  const stops = deriveStops(
    days.map((d) => ({
      dayId: d.dayId,
      date: d.date,
      overnightPlaceId: d.overnightPlaceId,
      overnightPlaceName: d.placeName,
    })),
  );
  const hasRealStop = stops.some((s) => s.placeId !== null);
  const transportModes = await loadTransportModes(trip.id);

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

  /**
   * PROTOTYPE ONLY (ticket 82): the per-stop controls, lifted out of the card
   * so all three variants can place them wherever their layout wants. Same
   * sheets, same server actions — only the surrounding drawing changes.
   */
  const stopControls = (stop: (typeof stops)[number]) => (
    <>
      <Sheet trigger="Change dates" title="Change these dates" triggerVariant="secondary">
        <ChangeDatesForm
          tripId={trip.id}
          dayIds={stop.dayIds}
          startDate={stop.startDate}
          endDate={stop.endDate}
          tripStart={trip.startDate}
          tripEnd={trip.endDate}
        />
      </Sheet>
      <Sheet trigger="Change place" title="Change overnight place" triggerVariant="secondary">
        <ChangePlaceForm tripId={trip.id} dayIds={stop.dayIds} />
      </Sheet>
      <form action={removeStop.bind(null, trip.id, stop.dayIds)}>
        <ConfirmSubmit
          message="Remove this stop? The days themselves stay on the itinerary — they just lose their overnight place."
          variant="ghost"
        >
          Remove stop
        </ConfirmSubmit>
      </form>
    </>
  );

  const variantProps = {
    stops,
    legMode,
    controls: stopControls,
    map: <RouteMap stops={pinned} missing={missing} />,
    tripStart: trip.startDate,
    tripEnd: trip.endDate,
  };

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
      ) : variant === "A" ? (
        <VariantA {...variantProps} />
      ) : variant === "B" ? (
        <VariantB {...variantProps} />
      ) : variant === "C" ? (
        <VariantC {...variantProps} />
      ) : (
        <Stack gap={4}>
          <RouteMap stops={pinned} missing={missing} />
          {/* Reordering is a real write, not a client-side sort — see
              lib/itinerary.ts. The list is handed over server-rendered; the
              client component only owns the dragging. */}
          <DragList
            label="stop"
            onReorder={reorderStops.bind(null, trip.id)}
            items={stops.map((stop, i) => ({
              key: stop.dayIds.join("-"),
              label: stop.placeName ?? "this stop",
              node: (
            <Card>
              <CardHeader
                strong
                title={
                  stop.placeId
                    ? stop.placeName ?? "Unnamed place"
                    : "No overnight place set"
                }
                hint={`${formatDate(stop.startDate)} – ${formatDate(stop.endDate)}`}
                actions={
                  <div className="flex items-center gap-2">
                    <Badge tone="marine">
                      {stop.nights} night{stop.nights === 1 ? "" : "s"}
                    </Badge>
                    {i > 0 ? (
                      <TransportHint
                        prevStop={stops[i - 1]}
                        stop={stop}
                        mode={legMode(i)}
                      />
                    ) : null}
                  </div>
                }
              />
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <p className="text-sm text-ink-soft">
                  {stop.dayIds.length} day{stop.dayIds.length === 1 ? "" : "s"}{" "}
                  on the itinerary
                </p>
                <div className="flex gap-2">
                  <Sheet trigger="Change dates" title="Change these dates" triggerVariant="secondary">
                    <ChangeDatesForm
                      tripId={trip.id}
                      dayIds={stop.dayIds}
                      startDate={stop.startDate}
                      endDate={stop.endDate}
                      tripStart={trip.startDate}
                      tripEnd={trip.endDate}
                    />
                  </Sheet>
                  <Sheet trigger="Change place" title="Change overnight place" triggerVariant="secondary">
                    <ChangePlaceForm tripId={trip.id} dayIds={stop.dayIds} />
                  </Sheet>
                  <form action={removeStop.bind(null, trip.id, stop.dayIds)}>
                    <ConfirmSubmit
                      message="Remove this stop? The days themselves stay on the itinerary — they just lose their overnight place."
                      variant="ghost"
                    >
                      Remove stop
                    </ConfirmSubmit>
                  </form>
                </div>
              </div>
            </Card>
              ),
            }))}
          />
        </Stack>
      )}
      {/* PROTOTYPE ONLY (ticket 82) — dev-only, leaves main with the variants. */}
      <PrototypeSwitcher variants={PROTOTYPE_VARIANTS} current={variant} />
    </Page>
  );
}

/**
 * Surfaces that a transport event should exist between two stops — a nudge,
 * not a requirement. Once one does, the badge also carries how the group is
 * getting there (ticket 78): the icon, plus the mode as a word, because a
 * picture is never the only signal either.
 */
function TransportHint({
  prevStop,
  stop,
  mode,
}: {
  prevStop: { placeName: string | null };
  stop: { placeName: string | null };
  /** null when no transport event on either side of the leg names one. */
  mode: TransportType | null;
}) {
  if (!prevStop.placeName || !stop.placeName || prevStop.placeName === stop.placeName) {
    return null;
  }
  return (
    <Badge tone="open">
      <span className="inline-flex items-center gap-1.5">
        {mode ? (
          <>
            <TravelModeIcon mode={mode} />
            <span>{mode}</span>
          </>
        ) : null}
        <span>
          {prevStop.placeName} → {stop.placeName}
        </span>
      </span>
    </Badge>
  );
}

/**
 * A stop's dates, for both forms on this page (ticket 87). The calendar is
 * scoped to the trip's own window, so a stop can't be dated into a month the
 * trip doesn't cover.
 *
 * When the trip has no dates the calendar has no window to draw, and rule 9
 * says undated is a normal state, not an error — so this falls back to the two
 * plain date inputs it replaced rather than blocking the form on "set the trip
 * dates first". A group that knows it's in Lisbon before it knows which week
 * can still say so.
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
  if (!tripStart || !tripEnd) {
    return (
      <div className="grid grid-cols-2 gap-3">
        <Field label="From">
          <Input type="date" name="startDate" defaultValue={startDate} required />
        </Field>
        <Field label="To">
          <Input type="date" name="endDate" defaultValue={endDate} required />
        </Field>
      </div>
    );
  }

  return (
    <Field label="Dates">
      <DateRangePicker
        startName="startDate"
        endName="endDate"
        min={tripStart}
        max={tripEnd}
        defaultStart={startDate}
        defaultEnd={endDate}
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
  async function action(formData: FormData) {
    "use server";
    const startDate = String(formData.get("startDate") ?? "");
    const endDate = String(formData.get("endDate") ?? "");
    const placeName = String(formData.get("placeName") ?? "");
    const providerId = String(formData.get("placeProviderId") ?? "") || null;
    const lat = formData.get("placeLat");
    const lng = formData.get("placeLng");
    if (!startDate || !endDate || !placeName) return;
    await addStop(tripId, {
      startDate,
      endDate,
      placeName,
      providerId,
      lat: lat ? Number(lat) : null,
      lng: lng ? Number(lng) : null,
    });
  }

  return (
    <form action={action}>
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
  async function action(formData: FormData) {
    "use server";
    await setStopDates(tripId, dayIds, {
      startDate: String(formData.get("startDate") ?? ""),
      endDate: String(formData.get("endDate") ?? ""),
    });
  }

  return (
    <form action={action}>
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
  async function action(formData: FormData) {
    "use server";
    const placeName = String(formData.get("placeName") ?? "");
    const providerId = String(formData.get("placeProviderId") ?? "") || null;
    const lat = formData.get("placeLat");
    const lng = formData.get("placeLng");
    if (!placeName) return;
    await setOvernightPlace(tripId, dayIds, {
      placeName,
      providerId,
      lat: lat ? Number(lat) : null,
      lng: lng ? Number(lng) : null,
    });
  }

  return (
    <form action={action}>
      <Stack gap={3}>
        <PlacePicker name="place" label="New place" search={searchPlacesAction} />
        <SubmitButton>Save</SubmitButton>
      </Stack>
    </form>
  );
}
