/**
 * Days page (ticket 15, re-imagined as a calendar by ticket 103). The only
 * route over the `day` + `day_event` dataset — Route was retired by ticket
 * 142, its map/stop-list now at the foot of Overview, and the overnight place
 * is set here on the band above the clock (ticket 141).
 *
 * `components/days-calendar.tsx` is a Client Component owning geometry and
 * gestures; this stays a Server Component owning every Server Action — the
 * event modal's panel, adding/removing a day — passed over as pre-rendered
 * nodes so mutations stay on the server.
 *
 * Notes hang off *events*, not days (a free-text per-day box had no clear use);
 * trip-wide talk lives on the Notes page now, not here (ticket 321).
 *
 * Each event category has its own colour (ticket 68) via `EVENT_CATEGORIES`,
 * with the word always present too — colour is never the only signal. A
 * flight event offers a Google Flights deep link only (ticket 10).
 */
import type { ReactNode } from "react";

import {
  addDays,
  deleteEvent,
  moveEventToAnotherDay,
  removeDay,
  rescheduleEvent,
  setDayOvernight,
  submitEvent,
} from "./actions";
import { searchPlacesAction } from "../place-actions";
import { ConfirmSubmit, SubmitButton } from "@/components/system/client-ui";
import {
  DaysCalendar,
  type CalendarDay,
  type CalendarEvent,
} from "@/components/days/days-calendar";
import { EventFiles } from "@/components/documents/event-files";
import type { FileChoice } from "@/components/documents/attach-existing";
import { EventForm } from "@/components/days/event-form";
import { Badge, ButtonLink, EmptyState } from "@/components/system/ui";
import { EVENT_CATEGORIES } from "@floc/core/itinerary/event-categories";
import { NoteThread, type NoteRow } from "@/components/notes/note-thread";
import { requireTripAccess } from "@/server/access";
import { listDaysWithEvents, type DayEventRow } from "@/server/itinerary/itinerary";
import { loadThreads } from "@/server/notes/notes-read";
import { byEvent, listDocuments } from "@/server/documents/documents";
import type { TripDocument } from "@/server/documents/documents";
import { documentsEnabled } from "@/server/documents/document-store";
import { addDays as addDaysToDate, fromIsoDate, today } from "@floc/core/dates/dates";

export default async function DaysPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ event?: string }>;
}) {
  const { id } = await params;
  const access = await requireTripAccess(id, `/trip/${id}/days`);
  const { trip, viewer, isAdmin, members } = access;

  // One person, one colour across every tab.
  const toneOf = new Map(members.map((m) => [m.userId, m.tone]));

  // Two independent reads that go out together (ticket 118). Trip-wide talk
  // moved to the Notes page (ticket 321), so the days route no longer reads
  // the trip thread or its links.
  const [days, notesByEvent, docs] = await Promise.all([
    listDaysWithEvents(trip.id),
    loadThreads({ tripId: trip.id, scope: "day_event", viewerId: viewer.id, toneOf }),
    documentsEnabled() ? listDocuments(trip.id, viewer.id) : [],
  ]);

  // One read for every block's files (tickets 322, 324), not one per event.
  const filesByEvent = byEvent(docs);
  const loose: FileChoice[] = docs
    .filter((d) => d.dayEventId === null)
    .map((d) => ({ id: d.id, name: d.name }));

  // Arrives from a file's "on [event]" tag (ticket 323).
  const openEventId = Number((await searchParams).event) || null;

  if (days.length === 0) {
    // Two empty states (ticket 126): an undated trip is sent to Dates rather
    // than offered "Add the first day", which would otherwise seed from
    // `today()` — a January trip picking up an August day it never asked for
    // (rule 9: undated is normal, never an error).
    return (
      <div className="mx-auto w-full max-w-[84rem] px-4 pb-20 pt-6 sm:px-6">
        <header>
          <h1 className="text-[clamp(1.9rem,4vw,2.8rem)]">Days</h1>
        </header>
        <div className="mt-8">
        {trip.startDate ? (
          <EmptyState
            title="No days yet"
            action={
              <form action={addDays.bind(null, trip.id, trip.startDate, 1)}>
                <SubmitButton variant="primary">Add the first day</SubmitButton>
              </form>
            }
          >
            The itinerary starts the moment there&rsquo;s a day to hang it on.
          </EmptyState>
        ) : (
          <EmptyState
            title="No dates yet"
            action={
              <ButtonLink variant="primary" href={`/trip/${trip.id}/dates`}>
                Pick the dates
              </ButtonLink>
            }
          >
            The itinerary hangs off the trip&rsquo;s dates, and they aren&rsquo;t
            settled yet.
          </EmptyState>
        )}
        </div>
      </div>
    );
  }

  const now = today();

  const calendarDays: CalendarDay[] = days.map((d) => ({
    id: d.id,
    date: d.date,
    weekday: partOf(d.date, { weekday: "short" }),
    dayOfMonth: partOf(d.date, { day: "numeric" }),
    longLabel: partOf(d.date, { weekday: "long", day: "numeric", month: "long" }),
    overnightPlaceName: d.overnightPlaceName,
    overnightPlaceId: d.overnightPlaceId,
    // Monday-first, because the calendar's weeks are. `getUTCDay` is Sunday-0
    // and has to be rotated; UTC for the same reason every other read here is
    // (rule 10).
    weekdayIndex: (fromIsoDate(d.date).getUTCDay() + 6) % 7,
    outside: false,
    isToday: d.date === now,
  }));

  // Pad the ends out to whole Monday–Sunday weeks (ticket 103) — a week
  // starting on the trip's first day would read as Wed–Tue.
  const framedDays = frameWeeks(calendarDays);

  const calendarEvents: CalendarEvent[] = [];
  const panels: Record<number, ReactNode> = {};

  for (const [index, d] of days.entries()) {
    const previousPlace = index > 0 ? days[index - 1].overnightPlaceName : null;

    for (const event of d.events) {
      const category = EVENT_CATEGORIES[event.type];
      calendarEvents.push({
        id: event.id,
        dayId: d.id,
        type: event.type,
        transportType: event.transportType,
        // The title leads (ticket 74). Rows written before the column existed
        // have none, so the place name stands in — and failing that, the
        // category's word, since a block must never be blank.
        title: event.title ?? event.placeName ?? category.label,
        placeName: event.placeName,
        time: event.time,
        endTime: event.endTime,
        allDay: event.allDay,
        hasNote: Boolean(event.note),
        hasFiles: (filesByEvent.get(event.id) ?? []).length > 0,
        // Replies count too — the block says how much conversation is in there.
        commentCount: (notesByEvent.get(event.id) ?? []).reduce(
          (n, run) => n + 1 + run.replies.length,
          0,
        ),
      });

      panels[event.id] = (
        <EventPanel
          tripId={trip.id}
          dayId={d.id}
          date={d.date}
          event={event}
          originPlaceName={previousPlace}
          destinationPlaceName={d.overnightPlaceName}
          notes={notesByEvent.get(event.id) ?? []}
          files={filesByEvent.get(event.id) ?? []}
          loose={loose}
          filesEnabled={documentsEnabled()}
          viewerId={viewer.id}
          isAdmin={isAdmin}
        />
      );
    }
  }

  const removeDayControls = Object.fromEntries(
    days.map((d) => [
      d.id,
      <form key={d.id} action={removeDay.bind(null, trip.id, d.id)}>
        <ConfirmSubmit
          message="Remove this day? Its events go with it."
          variant="ghost"
        >
          Remove day
        </ConfirmSubmit>
      </form>,
    ]),
  );

  return (
    <div className="mx-auto w-full max-w-[84rem] px-4 pb-20 pt-6 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="text-[clamp(1.9rem,4vw,2.8rem)]">Days</h1>
        </div>
      </header>

      <div className="mt-8">
      <DaysCalendar
        days={framedDays}
        events={calendarEvents}
        panels={panels}
        removeDayControls={removeDayControls}
        submitEvent={submitEvent.bind(null, trip.id)}
        rescheduleEvent={rescheduleEvent.bind(null, trip.id)}
        moveEventToDay={moveEventToAnotherDay.bind(null, trip.id)}
        setOvernight={setDayOvernight.bind(null, trip.id)}
        searchPlaces={searchPlacesAction}
        openEventId={openEventId}
      />
      </div>
    </div>
  );
}

/**
 * Pads a run of trip days out to whole Monday–Sunday weeks. Padding days carry
 * real dates (or the head numbers would jump) and `outside: true`, the
 * calendar's instruction to draw them shaded and refuse everything. Negative
 * ids mean nothing beyond "not a row".
 */
function frameWeeks(days: CalendarDay[]): CalendarDay[] {
  if (days.length === 0) return days;

  const filler = (date: string, index: number): CalendarDay => ({
    id: -index - 1,
    date,
    weekday: partOf(date, { weekday: "short" }),
    dayOfMonth: partOf(date, { day: "numeric" }),
    longLabel: partOf(date, { weekday: "long", day: "numeric", month: "long" }),
    overnightPlaceName: null,
    overnightPlaceId: null,
    weekdayIndex: (fromIsoDate(date).getUTCDay() + 6) % 7,
    outside: true,
    isToday: false,
  });

  const before: CalendarDay[] = [];
  for (let i = 1; i <= days[0].weekdayIndex; i++) {
    before.unshift(filler(addDaysToDate(days[0].date, -i), before.length));
  }

  const after: CalendarDay[] = [];
  const last = days[days.length - 1];
  for (let i = 1; i <= 6 - last.weekdayIndex; i++) {
    after.push(filler(addDaysToDate(last.date, i), before.length + after.length));
  }

  return [...before, ...days, ...after];
}

/** One date, formatted for a column head. UTC throughout (rule 10) — read in
 * local time, a date west of Greenwich renders as the day before. */
function partOf(date: string, opts: Intl.DateTimeFormatOptions) {
  return fromIsoDate(date).toLocaleDateString("en-GB", { ...opts, timeZone: "UTC" });
}

/**
 * The selected event's detail panel — every fact, the controls, and the thread.
 * Rendered here rather than in the calendar since all four actions are Server
 * Actions. A field with no answer still shows its row, saying so: "no time
 * set" is a thing the group needs to see, not an absence to hide.
 */
function EventPanel({
  tripId,
  dayId,
  date,
  event,
  originPlaceName,
  destinationPlaceName,
  notes,
  files,
  loose,
  filesEnabled,
  viewerId,
  isAdmin,
}: {
  tripId: number;
  dayId: number;
  date: string;
  event: DayEventRow;
  originPlaceName: string | null;
  destinationPlaceName: string | null;
  notes: NoteRow[];
  files: TripDocument[];
  loose: FileChoice[];
  filesEnabled: boolean;
  viewerId: string;
  isAdmin: boolean;
}) {
  const isTransport = event.type === "transport";
  const category = EVENT_CATEGORIES[event.type];
  const flightLink =
    isTransport && event.transportType === "flight"
      ? buildFlightSearchUrl({
          origin: originPlaceName ?? event.placeName ?? "",
          destination: destinationPlaceName ?? event.placeName ?? "",
          date,
        })
      : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Transport names its own kind — "ferry" says more than "transport"
            and is still the category's word. */}
        <Badge tone={category.tone}>
          {isTransport ? (event.transportType ?? "transport") : category.label}
        </Badge>
        <form action={deleteEvent.bind(null, tripId, event.id)}>
          <ConfirmSubmit message="Delete this event?" variant="ghost">
            Delete event
          </ConfirmSubmit>
        </form>
      </div>

      {/* The facts edit in place and save on change (ticket 321) — no read
          view, no Edit sheet. The title is the modal's heading. */}
      <EventForm
        autosave
        action={submitEvent.bind(null, tripId)}
        searchPlaces={searchPlacesAction}
        defaults={{
          dayId,
          eventId: event.id,
          type: event.type,
          transportType: event.transportType,
          time: event.time,
          endTime: event.endTime,
          allDay: event.allDay || !event.time,
          title: event.title,
          note: event.note,
          placeName: event.placeName,
        }}
      />

      {flightLink ? (
        <a
          href={flightLink}
          target="_blank"
          rel="noreferrer"
          className="inline-block text-sm font-medium text-pen underline underline-offset-2 transition-colors hover:bg-highlight-soft hover:text-pen-deep"
        >
          Search flights →
        </a>
      ) : null}

      {filesEnabled ? (
        <EventFiles
          tripId={tripId}
          dayEventId={event.id}
          files={files}
          loose={loose}
          viewerId={viewerId}
        />
      ) : null}

      <div className="border-t border-rule pt-3">
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
    </div>
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
