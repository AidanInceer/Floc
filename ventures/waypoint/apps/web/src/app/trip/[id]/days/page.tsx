/**
 * Days page (ticket 15). Route and Days are TWO routes over ONE dataset:
 * Route is the stop-level summary, Days is this page — the day-level detail,
 * one card per `day` row and its ordered `day_event` list. See
 * src/app/trip/[id]/route/page.tsx for the full two-page rationale.
 *
 * Notes hang off *events*, not days. There used to be a free-text box per day
 * and nobody could say what belonged in it; the thing a group actually wants to
 * annotate is "this ferry" or "that restaurant", so an event opens up to its own
 * details and thread.
 *
 * Activity vs transport are visually distinct: transport gets a directional
 * badge (transport type + time), an activity gets a plain marker. A flight
 * event additionally offers a Google Flights / Skyscanner search deep link —
 * ticket 10's floor is deep-links only, no live fares, no Amadeus call.
 */
import { and, asc, eq, inArray, isNull } from "drizzle-orm";

import {
  addDays,
  addEvent,
  deleteEvent,
  moveEvent,
  removeDay,
  reorderDays,
  resolveEventPlace,
  searchPlacesAction,
  updateEvent,
} from "./actions";
import {
  ConfirmSubmit,
  DragList,
  Sheet,
  SubmitButton,
} from "@/components/client-ui";
import { PlacePicker } from "@/components/place-picker";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Field,
  Input,
  LockedNotice,
  Page,
  PageHeader,
  Select,
  Stack,
  Textarea,
} from "@/components/ui";
import { NoteThread, type NoteRow } from "@/components/note-thread";
import { db } from "@/db";
import { day, dayEvent, place, user, userProfile } from "@/db/schema";
import type { DayEventType, TransportType } from "@/db/schema";
import { requireTripAccess } from "@/lib/access";
import { loadThreads } from "@/lib/notes-read";
import { formatDate } from "@/lib/dates";
import { lockReason } from "@/lib/tabs";

async function loadDays(tripId: number) {
  // Both reads are scoped to this trip and independent of each other, so they
  // go out together. The events read joins back through `day` to get that
  // scope — it used to select every `day_event` row in the database and throw
  // the other trips away in JS, which got slower with every trip added.
  const [days, events] = await Promise.all([
    db
      .select({
        id: day.id,
        date: day.date,
        overnightPlaceId: day.overnightPlaceId,
        overnightPlaceName: place.name,
      })
      .from(day)
      .leftJoin(place, eq(place.id, day.overnightPlaceId))
      .where(and(eq(day.tripId, tripId), isNull(day.deletedAt)))
      .orderBy(asc(day.date))
      .all(),
    db
      .select({
        id: dayEvent.id,
        dayId: dayEvent.dayId,
        orderIndex: dayEvent.orderIndex,
        type: dayEvent.type,
        transportType: dayEvent.transportType,
        time: dayEvent.time,
        note: dayEvent.note,
        placeName: place.name,
      })
      .from(dayEvent)
      .innerJoin(day, eq(day.id, dayEvent.dayId))
      .leftJoin(place, eq(place.id, dayEvent.placeId))
      .where(
        and(
          eq(day.tripId, tripId),
          isNull(day.deletedAt),
          isNull(dayEvent.deletedAt),
        ),
      )
      .orderBy(asc(dayEvent.orderIndex))
      .all(),
  ]);

  return {
    days: days.map((d) => ({
      ...d,
      events: events.filter((e) => e.dayId === d.id),
    })),
    // The threads need these, and reading them belongs to the caller now that
    // it takes a viewer (v0.2 ticket 06 — reactions are per-person).
    eventIds: events.map((e) => e.id),
  };
}

export default async function DaysPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const access = await requireTripAccess(id, `/trip/${id}/days`);
  const { trip, viewer, isAdmin, members } = access;

  if (!trip.daysUnlockedAt) {
    return (
      <Page wide flush>
        <PageHeader title="Days" />
        <LockedNotice reason={lockReason("days") ?? "Not open yet"} />
      </Page>
    );
  }

  const { days, eventIds } = await loadDays(trip.id);

  // Comment authors keep the avatar colour they already have in this trip's
  // roster, so one person is one colour across every tab.
  const toneOf = new Map(members.map((m) => [m.userId, m.tone]));
  const notesByEvent = await loadThreads({
    tripId: trip.id,
    scope: "day_event",
    scopeIds: eventIds,
    viewerId: viewer.id,
    toneOf,
  });

  return (
    <Page wide flush>
      <PageHeader
        title="Days"
        subtitle="What happens on each day, in order. Open an event for its details and whatever the group has said about it. Nights sleeping in a place are grouped on Route."
        actions={
          days.length > 0 ? (
            <form action={addDays.bind(null, trip.id, days[days.length - 1].date, 1)}>
              <SubmitButton variant="secondary">Add a day</SubmitButton>
            </form>
          ) : undefined
        }
      />

      {days.length === 0 ? (
        <EmptyState
          title="No days yet"
          action={
            <form action={addDays.bind(null, trip.id, trip.startDate ?? new Date().toISOString().slice(0, 10), 1)}>
              <SubmitButton>Add the first day</SubmitButton>
            </form>
          }
        >
          Once the trip has one day, everyone can start filling it in —
          activities, how you&rsquo;re getting around, and notes on each.
        </EmptyState>
      ) : (
        <Stack gap={4}>
          <p className="text-xs text-ink-faint">
            Drag a day by its grip to move it — the dates stay put and the plan
            moves between them, so swapping two days swaps what happens on them.
            Anything spent stays on the date it was spent.
          </p>
          <DragList
            label="day"
            onReorder={reorderDays.bind(null, trip.id)}
            items={days.map((d, i) => {
            const prevPlace = i > 0 ? days[i - 1].overnightPlaceName : null;
            return {
              key: String(d.id),
              label: formatDate(d.date),
              node: (
              <Card>
                <CardHeader
                  strong
                  title={formatDate(d.date, { year: true })}
                  hint={d.overnightPlaceName ? `Sleeping in ${d.overnightPlaceName}` : "No overnight place set"}
                  actions={
                    <form action={removeDay.bind(null, trip.id, d.id)}>
                      <ConfirmSubmit
                        message="Remove this day? Its events go with it."
                        variant="ghost"
                      >
                        Remove day
                      </ConfirmSubmit>
                    </form>
                  }
                />
                <div className="space-y-4 p-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-soft">
                        Plan for the day
                      </h3>
                      <Sheet trigger="Add event" title="Add an event" triggerVariant="secondary">
                        <EventForm tripId={trip.id} dayId={d.id} />
                      </Sheet>
                    </div>

                    {d.events.length === 0 ? (
                      <p className="text-sm text-ink-faint">Nothing planned yet.</p>
                    ) : (
                      <ul className="space-y-2">
                        {d.events.map((e, ei) => (
                          <li key={e.id}>
                            <EventRow
                              tripId={trip.id}
                              dayId={d.id}
                              event={e}
                              isFirst={ei === 0}
                              isLast={ei === d.events.length - 1}
                              originPlaceName={prevPlace}
                              destinationPlaceName={d.overnightPlaceName}
                              date={d.date}
                              notes={notesByEvent.get(e.id) ?? []}
                              viewerId={viewer.id}
                              isAdmin={isAdmin}
                            />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </Card>
              ),
            };
          })}
          />
        </Stack>
      )}
    </Page>
  );
}

/**
 * One event, closed to a single line and opening to its own detail panel — the
 * note, the thread, and the controls that used to crowd the row. Collapsed by
 * default because a full day is eight of these and the sequence is what you
 * read at a glance; the details are what you click into.
 *
 * The move/edit/delete controls live *inside* the panel rather than in the
 * summary: a button inside a `<summary>` toggles the disclosure as well as
 * firing, so every one of them would have collapsed the thing it acted on.
 */
function EventRow({
  tripId,
  dayId,
  event,
  isFirst,
  isLast,
  originPlaceName,
  destinationPlaceName,
  date,
  notes,
  viewerId,
  isAdmin,
}: {
  tripId: number;
  dayId: number;
  event: {
    id: number;
    type: DayEventType;
    transportType: TransportType | null;
    time: string | null;
    note: string | null;
    placeName: string | null;
  };
  isFirst: boolean;
  isLast: boolean;
  originPlaceName: string | null;
  destinationPlaceName: string | null;
  date: string;
  notes: NoteRow[];
  viewerId: string;
  isAdmin: boolean;
}) {
  const isTransport = event.type === "transport";
  // Replies count too — the summary says how much conversation is in there.
  const commentCount = notes.reduce((n, run) => n + 1 + run.replies.length, 0);
  const flightLink =
    isTransport && event.transportType === "flight"
      ? buildFlightSearchUrl({
          origin: originPlaceName ?? event.placeName ?? "",
          destination: destinationPlaceName ?? event.placeName ?? "",
          date,
        })
      : null;

  return (
    <details
      className={
        isTransport
          ? "group rounded-md border border-pen-soft bg-pen-soft/40"
          : "group rounded-md border border-rule bg-sheet-2"
      }
    >
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3 px-3 py-2">
        <span className="flex flex-1 flex-wrap items-center gap-2">
          {isTransport ? (
            <Badge tone="marine">{event.transportType ?? "transport"}</Badge>
          ) : (
            <Badge tone="neutral">Activity</Badge>
          )}
          {event.time ? (
            <span className="nums text-sm text-ink-soft">{event.time}</span>
          ) : null}
          {event.placeName ? (
            <span className="text-sm font-medium">{event.placeName}</span>
          ) : null}
          {event.note ? (
            <span className="line-clamp-1 text-sm text-ink-soft">{event.note}</span>
          ) : null}
        </span>
        <span className="flex shrink-0 items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.06em] text-ink-faint">
          {commentCount > 0 ? (
            <span>
              {commentCount} {commentCount === 1 ? "comment" : "comments"}
            </span>
          ) : null}
          {/* Rotates with the disclosure — the only affordance saying this opens. */}
          <span aria-hidden className="transition-transform group-open:rotate-90">
            ›
          </span>
        </span>
      </summary>

      <div className="space-y-3 border-t border-dotted border-rule-strong px-3 py-3">
        {event.note ? (
          <p className="text-sm">{event.note}</p>
        ) : (
          <p className="text-sm text-ink-faint">
            No details yet — Edit adds them.
          </p>
        )}

        {flightLink ? (
          <a
            href={flightLink}
            target="_blank"
            rel="noreferrer"
            className="inline-block text-sm font-medium text-pen underline underline-offset-2"
          >
            Search flights →
          </a>
        ) : null}

        <div className="flex flex-wrap items-center gap-1 border-t border-rule pt-2">
          <form action={moveEvent.bind(null, tripId, dayId, event.id, "up")}>
            <Button variant="ghost" disabled={isFirst} aria-label="Move earlier">
              ↑
            </Button>
          </form>
          <form action={moveEvent.bind(null, tripId, dayId, event.id, "down")}>
            <Button variant="ghost" disabled={isLast} aria-label="Move later">
              ↓
            </Button>
          </form>
          <Sheet trigger="Edit" title="Edit event" triggerVariant="ghost">
            <EventForm
              tripId={tripId}
              dayId={dayId}
              eventId={event.id}
              defaultType={event.type}
              defaultTransportType={event.transportType}
              defaultTime={event.time}
              defaultNote={event.note}
              defaultPlaceName={event.placeName}
            />
          </Sheet>
          <form action={deleteEvent.bind(null, tripId, event.id)}>
            <ConfirmSubmit message="Delete this event?" variant="ghost">
              Delete
            </ConfirmSubmit>
          </form>
        </div>

        <NoteThread
          tripId={tripId}
          scope="day_event"
          scopeId={event.id}
          notes={notes}
          viewerId={viewerId}
          isAdmin={isAdmin}
          placeholder="Anything the group should know about this?"
          invitation="Anything the group should know before the day arrives — a booking reference, who's meeting where, the fact it shuts at four."
        />
      </div>
    </details>
  );
}

function EventForm({
  tripId,
  dayId,
  eventId,
  defaultType = "activity",
  defaultTransportType,
  defaultTime,
  defaultNote,
  defaultPlaceName,
}: {
  tripId: number;
  dayId: number;
  eventId?: number;
  defaultType?: DayEventType;
  defaultTransportType?: TransportType | null;
  defaultTime?: string | null;
  defaultNote?: string | null;
  defaultPlaceName?: string | null;
}) {
  async function action(formData: FormData) {
    "use server";
    const type = String(formData.get("type") ?? "activity") as DayEventType;
    const transportType = (String(formData.get("transportType") ?? "") || null) as
      | TransportType
      | null;
    const time = String(formData.get("time") ?? "") || null;
    const note = String(formData.get("note") ?? "") || null;
    const placeName = String(formData.get("placeName") ?? "");
    const providerId = String(formData.get("placeProviderId") ?? "") || null;
    const lat = formData.get("placeLat");
    const lng = formData.get("placeLng");

    const placeId = await resolveEventPlace({
      providerId,
      name: placeName,
      lat: lat ? Number(lat) : null,
      lng: lng ? Number(lng) : null,
    });

    if (eventId) {
      await updateEvent(tripId, eventId, { type, placeId, transportType, time, note });
    } else {
      await addEvent(tripId, dayId, { type, placeId, transportType, time, note });
    }
  }

  return (
    <form action={action}>
      <Stack gap={3}>
        <Field label="Kind">
          <Select name="type" defaultValue={defaultType}>
            <option value="activity">Activity</option>
            <option value="transport">Transport</option>
          </Select>
        </Field>
        <Field label="Transport type" hint="Only used when kind is Transport">
          <Select name="transportType" defaultValue={defaultTransportType ?? ""}>
            <option value="">—</option>
            <option value="flight">Flight</option>
            <option value="train">Train</option>
            <option value="car">Car</option>
            <option value="ferry">Ferry</option>
            <option value="other">Other</option>
          </Select>
        </Field>
        <PlacePicker
          name="place"
          label="Place"
          defaultName={defaultPlaceName ?? ""}
          search={searchPlacesAction}
        />
        <Field label="Time" hint="HH:MM, local to the itinerary — no timezone">
          <Input type="time" name="time" defaultValue={defaultTime ?? ""} />
        </Field>
        <Field label="Note">
          <Textarea name="note" defaultValue={defaultNote ?? ""} rows={2} />
        </Field>
        <SubmitButton>{eventId ? "Save event" : "Add event"}</SubmitButton>
      </Stack>
    </form>
  );
}

/** Deep link only (ticket 10) — no Amadeus call, no live fare. */
function buildFlightSearchUrl({
  origin,
  destination,
  date,
}: {
  origin: string;
  destination: string;
  date: string;
}) {
  if (!origin || !destination) return null;
  const q = `Flights from ${origin} to ${destination} on ${date}`;
  return `https://www.google.com/travel/flights?q=${encodeURIComponent(q)}`;
}
