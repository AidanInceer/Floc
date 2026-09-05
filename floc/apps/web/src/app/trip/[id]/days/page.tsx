/**
 * Days page (ticket 15, re-imagined as a calendar by ticket 103). The only
 * route over the `day` + `day_event` dataset — Route was retired by ticket
 * 142, its map/stop-list now at the foot of Overview, and the overnight place
 * is set here on the band above the clock (ticket 141).
 *
 * `components/days-calendar.tsx` is a Client Component owning geometry and
 * gestures; this stays a Server Component owning every Server Action — the
 * detail panel, trip-wide thread, adding/removing a day — passed over as
 * pre-rendered nodes so mutations stay on the server.
 *
 * Notes hang off *events*, not days (a free-text per-day box had no clear use);
 * the trip-wide thread in the pane's other tab covers what's about the trip
 * rather than any one event.
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
import { ConfirmSubmit, Menu, Sheet, SubmitButton } from "@/components/client-ui";
import {
  DaysCalendar,
  type CalendarDay,
  type CalendarEvent,
} from "@/components/days-calendar";
import { EventForm } from "@/components/event-form";
import { Badge, ButtonLink, EmptyState, menuDangerItemClass, menuItemClass } from "@/components/ui";
import { EVENT_CATEGORIES } from "@floc/core/event-categories";
import { formatLength, formatSpan, spanOf } from "@floc/core/calendar";
import { NoteThread, type NoteRow } from "@/components/note-thread";
import { requireTripAccess } from "@/server/access";
import { listDaysWithEvents, type DayEventRow } from "@/server/itinerary";
import { loadThreads } from "@/server/notes-read";
import { listTripLinks } from "@/server/trip-links";
import { TripLinks } from "@/components/trip-links";
import { addDays as addDaysToDate, fromIsoDate, today } from "@floc/core/dates";

export default async function DaysPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const access = await requireTripAccess(id, `/trip/${id}/days`);
  const { trip, viewer, isAdmin, members } = access;

  // One person, one colour across every tab.
  const toneOf = new Map(members.map((m) => [m.userId, m.tone]));

  // Independent reads that go out together — threads scope by trip rather
  // than by event ids, so none waits on another (ticket 118).
  const [days, notesByEvent, tripNotes, tripLinks] = await Promise.all([
    listDaysWithEvents(trip.id),
    loadThreads({ tripId: trip.id, scope: "day_event", viewerId: viewer.id, toneOf }),
    loadThreads({ tripId: trip.id, scope: "trip", viewerId: viewer.id, toneOf }),
    listTripLinks(trip.id),
  ]);

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
        tripThread={
          <>
            <h3 className="typed">Trip thread</h3>
            <p className="mt-1 text-sm text-ink-soft">
              For the things that belong to the whole trip rather than to one
              event — the deposit that went out, the car nobody has booked, the
              day that is loose on purpose.
            </p>
            <NoteThread
              tripId={trip.id}
              scope="trip"
              scopeId={trip.id}
              notes={tripNotes.get(trip.id) ?? []}
              viewerId={viewer.id}
              isAdmin={isAdmin}
              placeholder="Anything the group should know?"
            />
            <TripLinks tripId={trip.id} links={tripLinks} />
          </>
        }
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
  viewerId: string;
  isAdmin: boolean;
}) {
  const isTransport = event.type === "transport";
  const category = EVENT_CATEGORIES[event.type];
  const span = spanOf(event);
  const flightLink =
    isTransport && event.transportType === "flight"
      ? buildFlightSearchUrl({
          origin: originPlaceName ?? event.placeName ?? "",
          destination: destinationPlaceName ?? event.placeName ?? "",
          date,
        })
      : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Transport names its own kind — "ferry" says more than "transport"
            and is still the category's word. */}
        <Badge tone={category.tone}>
          {isTransport ? (event.transportType ?? "transport") : category.label}
        </Badge>
      </div>

      <h3 className="font-display text-base font-semibold">
        {event.title ?? event.placeName ?? category.label}
      </h3>

      <dl className="grid grid-cols-[4.5rem_1fr] gap-x-3 gap-y-1.5">
        <Detail label="Time">
          {span ? (
            <span className="nums">
              {formatSpan(event)}
              {span.open
                ? " — no end time"
                : ` · ${formatLength(span.end - span.start)}`}
            </span>
          ) : (
            <span className="text-ink-faint">All day — no time set</span>
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

      {/* One triple-dot for both verbs (ticket 125), sharing the thread's
          header row with the sort toggle (ticket 233). */}
      <NoteThread
        tripId={tripId}
        scope="day_event"
        scopeId={event.id}
        notes={notes}
        viewerId={viewerId}
        isAdmin={isAdmin}
        placeholder="Anything the group should know about this?"
        toolbar={
          <Menu label={`Actions for ${event.title}`}>
            <Sheet trigger="Edit" title="Edit event" triggerVariant="ghost" triggerClassName={menuItemClass}>
              <EventForm
                action={submitEvent.bind(null, tripId)}
                searchPlaces={searchPlacesAction}
                defaults={{
                  dayId,
                  eventId: event.id,
                  type: event.type,
                  transportType: event.transportType,
                  time: event.time,
                  endTime: event.endTime,
                  /* Rows predating the flag have no start time, which is what
                     all-day means — same rule the ordering uses. */
                  allDay: event.allDay || !event.time,
                  title: event.title,
                  note: event.note,
                  placeName: event.placeName,
                }}
              />
            </Sheet>
            <form action={deleteEvent.bind(null, tripId, event.id)}>
              <ConfirmSubmit
                message="Delete this event?"
                variant="ghost"
                className={menuDangerItemClass}
              >
                Delete
              </ConfirmSubmit>
            </form>
          </Menu>
        }
      />
    </div>
  );
}

/** One labelled fact in the detail panel. */
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
