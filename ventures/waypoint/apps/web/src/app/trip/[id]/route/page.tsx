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

import { addStop, removeStop, searchPlacesAction, setOvernightPlace } from "./actions";
import { Sheet, SubmitButton, ConfirmSubmit } from "@/components/client-ui";
import { PlacePicker } from "@/components/place-picker";
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
          {stops.map((stop, i) => (
            <Card key={stop.dayIds.join("-")}>
              <CardHeader
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
                  <Sheet trigger="Change place" title="Change overnight place" triggerVariant="secondary">
                    <ChangePlaceForm tripId={trip.id} dayIds={stop.dayIds} />
                  </Sheet>
                  <form action={removeStop.bind(null, trip.id, stop.dayIds)}>
                    <ConfirmSubmit
                      message="Clear the overnight place for these days? The days themselves stay on the itinerary."
                      variant="ghost"
                    >
                      Unset
                    </ConfirmSubmit>
                  </form>
                </div>
              </div>
            </Card>
          ))}
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
    const mapboxId = String(formData.get("placeMapboxId") ?? "") || null;
    const lat = formData.get("placeLat");
    const lng = formData.get("placeLng");
    if (!startDate || !endDate || !placeName) return;
    await addStop(tripId, {
      startDate,
      endDate,
      placeName,
      mapboxId,
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

function ChangePlaceForm({ tripId, dayIds }: { tripId: number; dayIds: number[] }) {
  async function action(formData: FormData) {
    "use server";
    const placeName = String(formData.get("placeName") ?? "");
    const mapboxId = String(formData.get("placeMapboxId") ?? "") || null;
    const lat = formData.get("placeLat");
    const lng = formData.get("placeLng");
    if (!placeName) return;
    await setOvernightPlace(tripId, dayIds, {
      placeName,
      mapboxId,
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
