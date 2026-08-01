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
 * Every event is one of three categories and each has its own colour (ticket
 * 68): blue for transport, green for an activity, yellow for food. The
 * vocabulary lives in `EVENT_CATEGORIES` so the badge, the row tint and the
 * picker can't drift apart, and the badge always says the word — colour is
 * never the only signal. A flight event additionally offers a Google Flights
 * search deep link — ticket 10's floor is deep-links only, no live fares, no
 * Amadeus call.
 */
import { and, asc, eq, isNull } from "drizzle-orm";
import type { ReactNode } from "react";

import {
  addDays,
  addEvent,
  deleteEvent,
  moveEvent,
  removeDay,
  insertEventAt,
  reorderDays,
  swapEvents,
  updateEvent,
} from "./actions";
import { resolveEventPlace, searchPlacesAction } from "../place-actions";
import {
  ConfirmSubmit,
  DragList,
  Sheet,
  SubmitButton,
} from "@/components/client-ui";
import { EventCategoryFilter } from "@/components/event-category-filter";
import { EventDragList } from "@/components/event-drag-list";
import { EventTimeFields } from "@/components/event-time-fields";
import { EventTypeFields } from "@/components/event-type-fields";
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
  Stack,
  Textarea,
  cx,
} from "@/components/ui";
import { EVENT_CATEGORIES } from "@/lib/event-categories";
import { findOverlaps, orderEvents } from "@/lib/event-order";
import { NoteThread, type NoteRow } from "@/components/note-thread";
import { db } from "@/db";
import { day, dayEvent, place } from "@/db/schema";
import type { DayEventType, TransportType } from "@/db/schema";
import { requireTripAccess } from "@/server/access";
import { loadThreads } from "@/server/notes-read";
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
        title: dayEvent.title,
        transportType: dayEvent.transportType,
        time: dayEvent.time,
        endTime: dayEvent.endTime,
        allDay: dayEvent.allDay,
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
      .all(),
  ]);

  return {
    days: days.map((d) => ({
      ...d,
      // A day reads as a timeline, so time decides the order and `order_index`
      // only breaks ties — see lib/event-order.ts for why, and for what a drag
      // does about it.
      events: orderEvents(events.filter((e) => e.dayId === d.id)),
    })),
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

  // Comment authors keep the avatar colour they already have in this trip's
  // roster, so one person is one colour across every tab.
  const toneOf = new Map(members.map((m) => [m.userId, m.tone]));

  // The threads scope themselves by trip, so they no longer wait on the event
  // ids — the days and their comments are one round trip, not two.
  const [{ days }, notesByEvent] = await Promise.all([
    loadDays(trip.id),
    loadThreads({
      tripId: trip.id,
      scope: "day_event",
      viewerId: viewer.id,
      toneOf,
    }),
  ]);

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
        />
      ) : (
        <Stack gap={4}>
          {/* The key for the row colours (ticket 68), which is also the filter
              (ticket 90) — each swatch carries its word, so the colours are a
              shortcut and never the only signal. */}
          <EventCategoryFilter>
          <DragList
            label="day"
            onReorder={reorderDays.bind(null, trip.id)}
            items={days.map((d, i) => {
            const prevPlace = i > 0 ? days[i - 1].overnightPlaceName : null;
            // Overlapping is allowed, so this is only ever a thing to show.
            const clashing = findOverlaps(d.events);
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

                    {/* Grip on the left edge of the row, not in a strip above
                        it: an event is one line tall, so a control bar per
                        event would double the day's height and bury the
                        sequence the page exists to show. The ↑/↓ pair lives
                        inside the opened event instead. */}
                    <EventDragList
                      dayId={d.id}
                      emptyLabel="Nothing planned yet."
                      onSwap={swapEvents.bind(null, trip.id, d.id)}
                      onInsert={async (eventId, fromDayId, index) => {
                        "use server";
                        await insertEventAt(
                          trip.id,
                          eventId,
                          fromDayId,
                          d.id,
                          index,
                        );
                      }}
                      items={d.events.map((e, ei) => ({
                        id: e.id,
                        label: e.title ?? e.placeName ?? EVENT_CATEGORIES[e.type].label,
                        category: e.type,
                        node: (
                          <EventRow
                            tripId={trip.id}
                            dayId={d.id}
                            event={e}
                            isFirst={ei === 0}
                            isLast={ei === d.events.length - 1}
                            clashes={clashing.has(e.id)}
                            originPlaceName={prevPlace}
                            destinationPlaceName={d.overnightPlaceName}
                            date={d.date}
                            notes={notesByEvent.get(e.id) ?? []}
                            viewerId={viewer.id}
                            isAdmin={isAdmin}
                          />
                        ),
                      }))}
                    />
                  </div>
                </div>
              </Card>
              ),
            };
          })}
          />
          </EventCategoryFilter>
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
  clashes,
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
    title: string | null;
    transportType: TransportType | null;
    time: string | null;
    endTime: string | null;
    allDay: boolean;
    note: string | null;
    placeName: string | null;
  };
  isFirst: boolean;
  isLast: boolean;
  /** Shares a slice of the clock with another event on the same day. */
  clashes: boolean;
  originPlaceName: string | null;
  destinationPlaceName: string | null;
  date: string;
  notes: NoteRow[];
  viewerId: string;
  isAdmin: boolean;
}) {
  const isTransport = event.type === "transport";
  const category = EVENT_CATEGORIES[event.type];
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
    <details className={cx("group rounded-md border", category.row)}>
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3 px-3 py-2">
        <span className="flex flex-1 flex-wrap items-center gap-2">
          {/* Transport names its own kind — "ferry" says more than "transport"
              and is still the category's word. */}
          <Badge tone={category.tone}>
            {isTransport ? event.transportType ?? "transport" : category.label}
          </Badge>
          {/* One column's worth of clock, so the times line up down the day
              whether or not an event has an end. */}
          <span className="nums text-sm text-ink-soft">
            {event.allDay || !event.time ? "All day" : formatSpan(event)}
          </span>
          {/* The title leads (ticket 74). Rows written before the column
              existed have none, so the place name stands in — and failing
              that, the category's word, since a row must never be blank. */}
          <span className="text-sm font-medium">
            {event.title ?? event.placeName ?? category.label}
          </span>
          {event.title && event.placeName ? (
            <span className="text-sm text-ink-soft">{event.placeName}</span>
          ) : null}
        </span>
        <span className="flex shrink-0 items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.06em] text-ink-faint">
          {clashes ? <span title="Overlaps another event">Overlaps</span> : null}
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
        {/*
         * Every fact gets a label. The panel used to be the bare note text and
         * nothing else, which left you guessing which line was the event's name
         * and which was somebody's aside — and the time and place, both already
         * stored, weren't shown here at all. A field with no answer still shows
         * its row, saying so: "no time set" is a thing the group needs to see,
         * not an absence to hide.
         */}
        <dl className="grid grid-cols-[5.5rem_1fr] gap-x-3 gap-y-1.5">
          <Detail label="Time">
            {event.allDay || !event.time ? (
              <span className="text-ink-faint">
                All day — sits at the end of the day
              </span>
            ) : (
              <span className="nums">
                {formatSpan(event)}
                {event.endTime ? null : " — no end time"}
              </span>
            )}
          </Detail>
          <Detail label="Place">
            {event.placeName ?? <span className="text-ink-faint">Not set</span>}
          </Detail>
          <Detail label="Type">
            {isTransport && event.transportType
              ? `${category.label} — ${event.transportType}`
              : category.label}
          </Detail>
          <Detail label="Notes">
            {event.note ?? <span className="text-ink-faint">None yet</span>}
          </Detail>
        </dl>

        {clashes ? (
          /* A statement, not a warning: two people can be doing different
             things at three o'clock, and a group planner that refused to let
             them would be wrong more often than it was right. The word carries
             it — no red, nothing to dismiss. */
          <p className="text-sm text-ink-soft">
            Overlaps another event on this day.
          </p>
        ) : null}

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
              defaultEndTime={event.endTime}
              /* Rows predating the flag have no start time, which is what
                 all-day means — same rule the ordering uses. */
              defaultAllDay={event.allDay || !event.time}
              defaultTitle={event.title}
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
  defaultEndTime,
  defaultAllDay,
  defaultTitle,
  defaultNote,
  defaultPlaceName,
}: {
  tripId: number;
  dayId: number;
  eventId?: number;
  defaultType?: DayEventType;
  defaultTransportType?: TransportType | null;
  defaultTime?: string | null;
  defaultEndTime?: string | null;
  defaultAllDay?: boolean;
  defaultTitle?: string | null;
  defaultNote?: string | null;
  defaultPlaceName?: string | null;
}) {
  async function action(formData: FormData) {
    "use server";
    const type = String(formData.get("type") ?? "activity") as DayEventType;
    const title = String(formData.get("title") ?? "").trim();
    // The input is `required`, so an empty title only arrives from a client
    // with validation off. Drop it rather than write a nameless event.
    if (!title) return;
    const transportType = (String(formData.get("transportType") ?? "") || null) as
      | TransportType
      | null;
    const allDay = formData.get("allDay") === "on";
    const time = String(formData.get("time") ?? "") || null;
    const endTime = String(formData.get("endTime") ?? "") || null;
    const note = String(formData.get("note") ?? "") || null;
    const placeName = String(formData.get("placeName") ?? "");
    const providerId = String(formData.get("placeProviderId") ?? "") || null;
    const lat = formData.get("placeLat");
    const lng = formData.get("placeLng");
    const countryCode = String(formData.get("placeCountryCode") ?? "") || null;

    const placeId = await resolveEventPlace({
      providerId,
      name: placeName,
      lat: lat ? Number(lat) : null,
      lng: lng ? Number(lng) : null,
      countryCode,
    });

    if (eventId) {
      await updateEvent(tripId, eventId, { type, title, placeId, transportType, time, endTime, allDay, note });
    } else {
      await addEvent(tripId, dayId, { type, title, placeId, transportType, time, endTime, allDay, note });
    }
  }

  /*
   * The name comes first (ticket 74). You know what you're adding before you
   * know how to file it — "mini golf" is the thought, "activity" is the
   * paperwork — and a required field at the top also makes the form's one
   * mandatory answer the first thing you meet rather than something you scroll
   * back up for. Then: type, how (transport only), place, time, notes.
   *
   * Place is optional because plenty of events don't have one worth pinning
   * ("pack up and check out"), and Notes sits last and secondary so the name
   * carries the meaning and the notes carry the detail.
   */
  return (
    <form action={action}>
      <Stack gap={3}>
        <Field label="Event name">
          <Input
            name="title"
            required
            maxLength={120}
            defaultValue={defaultTitle ?? ""}
            placeholder="Mini golf"
          />
        </Field>
        <EventTypeFields
          defaultType={defaultType}
          defaultTransportType={defaultTransportType}
        />
        <PlacePicker
          name="place"
          label="Place (optional)"
          defaultName={defaultPlaceName ?? ""}
          search={searchPlacesAction}
        />
        <EventTimeFields
          defaultTime={defaultTime}
          defaultEndTime={defaultEndTime}
          defaultAllDay={defaultAllDay}
        />
        <Field
          label="Notes"
          hint="Optional — booking references, who's meeting where, the fact it shuts at four."
        >
          <Textarea name="note" defaultValue={defaultNote ?? ""} rows={2} />
        </Field>
        <SubmitButton>{eventId ? "Save event" : "Add event"}</SubmitButton>
      </Stack>
    </form>
  );
}

/** `09:00` or `09:00–11:30` — an en dash, because it's a range not a minus. */
function formatSpan(event: { time: string | null; endTime: string | null }) {
  if (!event.time) return "";
  return event.endTime ? `${event.time}–${event.endTime}` : event.time;
}

/** One labelled fact in an opened event's panel. */
function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="font-mono text-[10.5px] uppercase leading-5 tracking-[0.06em] text-ink-faint">
        {label}
      </dt>
      <dd className="text-sm">{children}</dd>
    </>
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
