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
import { db } from "@/db";
import { day, place } from "@/db/schema";
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

export default async function RoutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
      defaultStart={trip.startDate ?? undefined}
      defaultEnd={trip.endDate ?? undefined}
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
        >
          Pin down where you&rsquo;re sleeping first — everyone can add or
          change a stop, no admin needed.
        </EmptyState>
      ) : (
        <Stack gap={4}>
          <RouteMap stops={pinned} missing={missing} />
          <p className="text-xs text-ink-faint">
            Drag a stop by its grip to change the order — the stops keep their
            nights and take the dates that lands them on. What&rsquo;s planned
            for each day travels with the stop; anything spent stays on the date
            it was spent.
          </p>
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
                      <TransportHint prevStop={stops[i - 1]} stop={stop} />
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
    </Page>
  );
}

/** Surfaces that a transport event should exist between two stops — a nudge, not a requirement. */
function TransportHint({
  prevStop,
  stop,
}: {
  prevStop: { placeName: string | null };
  stop: { placeName: string | null };
}) {
  if (!prevStop.placeName || !stop.placeName || prevStop.placeName === stop.placeName) {
    return null;
  }
  return (
    <Badge tone="open">
      {prevStop.placeName} → {stop.placeName}
    </Badge>
  );
}

function AddStopForm({
  tripId,
  defaultStart,
  defaultEnd,
}: {
  tripId: number;
  defaultStart?: string;
  defaultEnd?: string;
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
        <div className="grid grid-cols-2 gap-3">
          <Field label="From">
            <Input type="date" name="startDate" defaultValue={defaultStart} required />
          </Field>
          <Field label="To">
            <Input type="date" name="endDate" defaultValue={defaultEnd} required />
          </Field>
        </div>
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
}: {
  tripId: number;
  dayIds: number[];
  startDate: string;
  endDate: string;
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
        <div className="grid grid-cols-2 gap-3">
          <Field label="From">
            <Input type="date" name="startDate" defaultValue={startDate} required />
          </Field>
          <Field label="To">
            <Input type="date" name="endDate" defaultValue={endDate} required />
          </Field>
        </div>
        <p className="text-xs text-ink-faint">
          Days outside the new dates keep their place on the itinerary, they
          just stop belonging to this stop. Dates that already belong to the
          stop either side will be taken over by this one.
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
