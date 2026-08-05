/**
 * Days page (ticket 15, re-imagined as a calendar by ticket 103). Route and
 * Days are TWO routes over ONE dataset: Route is the stop-level summary, Days
 * is this page — the day-level detail, one column per `day` row and its
 * `day_event` rows drawn against the clock. See src/app/trip/[id]/route/page.tsx
 * for the full two-page rationale.
 *
 * It used to be a stack of cards, one per day, each holding a list of collapsed
 * event rows. The list said what was happening and in what order and nothing
 * about *shape* — you couldn't see that Tuesday had a four-hour hole in it, or
 * that two things were booked at three o'clock, without reading every row's
 * times and doing the arithmetic yourself. A time grid is the same data with
 * the arithmetic done: gaps are gaps, overlaps sit side by side in their own
 * lanes, and putting something somewhere is a drag rather than a form.
 *
 * The division of labour with `components/days-calendar.tsx` is deliberate.
 * That file is a Client Component and owns geometry and gestures — where a
 * block sits, what a drag means, when the week stops fitting. This one stays a
 * Server Component and owns everything with a Server Action behind it: the
 * detail panel with its edit, delete and thread, the trip-wide thread, adding
 * and removing a day. Those go over as pre-rendered nodes, one panel per event,
 * which is what keeps the mutations on the server where the rest of the app
 * keeps them.
 *
 * Notes still hang off *events*, not days. There used to be a free-text box per
 * day and nobody could say what belonged in it; the thing a group actually
 * wants to annotate is "this ferry" or "that restaurant". What the calendar
 * adds is a second, trip-wide thread in the pane's other tab — the place for
 * the things that are about the trip rather than about any one event, which
 * previously had nowhere to go but the group chat.
 *
 * Every event is one of three categories and each has its own colour (ticket
 * 68): blue for transport, green for an activity, yellow for food. The
 * vocabulary lives in `EVENT_CATEGORIES` so the badge, the block's tint and the
 * filter chip can't drift apart, and the word is always there too — colour is
 * never the only signal. A flight event additionally offers a Google Flights
 * search deep link — ticket 10's floor is deep-links only, no live fares.
 */
import type { ReactNode } from "react";

import {
  addDays,
  deleteEvent,
  moveEventToAnotherDay,
  removeDay,
  rescheduleEvent,
  submitEvent,
} from "./actions";
import { searchPlacesAction } from "../place-actions";
import { ConfirmSubmit, Sheet, SubmitButton } from "@/components/client-ui";
import {
  DaysCalendar,
  type CalendarDay,
  type CalendarEvent,
} from "@/components/days-calendar";
import { EventForm } from "@/components/event-form";
import {
  Badge,
  EmptyState,
  LockedNotice,
  Page,
  PageHeader,
  cx,
} from "@/components/ui";
import { EVENT_CATEGORIES } from "@/lib/event-categories";
import { formatLength, formatSpan, spanOf } from "@/lib/calendar";
import { NoteThread, type NoteRow } from "@/components/note-thread";
import { requireTripAccess } from "@/server/access";
import { listDaysWithEvents, type DayEventRow } from "@/server/itinerary";
import { loadThreads } from "@/server/notes-read";
import { listTripLinks } from "@/server/trip-links";
import { TripLinks } from "@/components/trip-links";
import { addDays as addDaysToDate, fromIsoDate, today } from "@/lib/dates";
import { lockReason } from "@/lib/tabs";

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

  // Three independent reads, so they go out together. The threads scope
  // themselves by trip rather than by the event ids, so none of them waits on
  // another (ticket 118).
  const [days, notesByEvent, tripNotes, tripLinks] = await Promise.all([
    listDaysWithEvents(trip.id),
    loadThreads({ tripId: trip.id, scope: "day_event", viewerId: viewer.id, toneOf }),
    loadThreads({ tripId: trip.id, scope: "trip", viewerId: viewer.id, toneOf }),
    listTripLinks(trip.id),
  ]);

  if (days.length === 0) {
    return (
      <Page wide flush>
        <PageHeader title="Days" />
        <EmptyState
          title="No days yet"
          action={
            <form
              action={addDays.bind(
                null,
                trip.id,
                trip.startDate ?? today(),
                1,
              )}
            >
              <SubmitButton>Add the first day</SubmitButton>
            </form>
          }
        />
      </Page>
    );
  }

  const now = today();
  const stops = stopsFor(days);

  const calendarDays: CalendarDay[] = days.map((d) => ({
    id: d.id,
    date: d.date,
    weekday: partOf(d.date, { weekday: "short" }),
    dayOfMonth: partOf(d.date, { day: "numeric" }),
    longLabel: partOf(d.date, { weekday: "long", day: "numeric", month: "long" }),
    overnightPlaceName: d.overnightPlaceName,
    // Monday-first, because the calendar's weeks are. `getUTCDay` is Sunday-0
    // and has to be rotated; UTC for the same reason every other read here is
    // (rule 10).
    weekdayIndex: (fromIsoDate(d.date).getUTCDay() + 6) % 7,
    stop: stops.get(d.id) ?? null,
    outside: false,
    isToday: d.date === now,
  }));

  /*
   * Pad the ends out to whole Monday–Sunday weeks (ticket 103).
   *
   * A week view that starts on the trip's first day is not a week — the
   * columns say Wed–Tue and you have to read the dates twice to place
   * yourself. So the frame is always the calendar week, and the days the trip
   * doesn't cover are drawn in it, shaded and inert: they say "the trip isn't
   * on then", which is information, where a missing column says nothing.
   *
   * Negative ids because they are not `day` rows and never will be — nothing
   * can be dropped on one, no event can belong to one, and a negative id can't
   * collide with a real one if either ever leaks into a lookup.
   */
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
    <Page wide flush>
      <PageHeader title="Days" />

      <DaysCalendar
        days={framedDays}
        events={calendarEvents}
        panels={panels}
        removeDayControls={removeDayControls}
        dayActions={
          <form action={addDays.bind(null, trip.id, days[days.length - 1].date, 1)}>
            <SubmitButton variant="secondary">Add a day</SubmitButton>
          </form>
        }
        submitEvent={submitEvent.bind(null, trip.id)}
        rescheduleEvent={rescheduleEvent.bind(null, trip.id)}
        moveEventToDay={moveEventToAnotherDay.bind(null, trip.id)}
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
    </Page>
  );
}

/**
 * Pads a run of trip days out to whole Monday–Sunday weeks.
 *
 * The padding days are real dates — they have to be, or the numbers in the
 * heads would jump — and they carry `outside: true`, which is the calendar's
 * instruction to draw them shaded and refuse everything: no add, no drop, no
 * blocks. Their ids are negative and mean nothing beyond "not a row".
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
    weekdayIndex: (fromIsoDate(date).getUTCDay() + 6) % 7,
    stop: null,
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

/**
 * Which stop each day belongs to (rule 3).
 *
 * A stop is not stored and never will be: it is a *run of consecutive days
 * sharing an overnight place*, derived here the same way Route derives it. The
 * calendar needs it because a column head that only says "Sleeping in Lisbon"
 * can't tell you whether tonight is the first of three or the last — which is
 * the difference between a travel day and a settled one, and the thing you are
 * actually looking for when you scan across a week.
 *
 * A day with no overnight place is in no stop. That is a real state, not a gap
 * to paper over: the group hasn't decided where they're sleeping.
 */
function stopsFor(
  days: { id: number; overnightPlaceId: number | null; overnightPlaceName: string | null }[],
) {
  const byDay = new Map<number, { label: string; night: number; nights: number }>();
  let index = 0;

  for (let i = 0; i < days.length; i++) {
    const placeId = days[i].overnightPlaceId;
    if (placeId === null) continue;
    // Only the start of a run opens a stop; the rest of the run is consumed
    // here so the counter matches Route's numbering.
    if (i > 0 && days[i - 1].overnightPlaceId === placeId) continue;

    index++;
    let end = i;
    while (end + 1 < days.length && days[end + 1].overnightPlaceId === placeId) end++;
    const nights = end - i + 1;
    for (let j = i; j <= end; j++) {
      byDay.set(days[j].id, {
        label: `Stop ${index} · ${days[j].overnightPlaceName ?? "Unnamed place"}`,
        night: j - i + 1,
        nights,
      });
    }
  }

  return byDay;
}

/**
 * One date, formatted for a column head. `timeZone: "UTC"` throughout, because
 * a day is a date-only `YYYY-MM-DD` string and nothing else (rule 10) — read in
 * local time, a date west of Greenwich renders as the day before.
 */
function partOf(date: string, opts: Intl.DateTimeFormatOptions) {
  return fromIsoDate(date).toLocaleDateString("en-GB", { ...opts, timeZone: "UTC" });
}

/**
 * The selected event's detail panel — every fact, the controls, and the thread.
 *
 * Rendered here rather than in the calendar, one per event, because all four
 * things it can do are Server Actions. It used to be the body of a `<details>`
 * on each row; the panel is the same content in a place where only one is open
 * at a time, which is what the side pane was for.
 *
 * A field with no answer still shows its row, saying so: "no time set" is a
 * thing the group needs to see, not an absence to hide.
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
        {/*
          No "overlaps another event" word any more (ticket 103). On the list it
          was the only way to know; on the grid the two blocks are drawn side by
          side in their own lanes, which says it better and says it where you
          are looking. Overlapping was never a fault to report — two people can
          be doing different things at three o'clock.
        */}
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

      <div className={cx("flex flex-wrap items-center gap-1 border-t border-rule pt-2")}>
        <Sheet trigger="Edit" title="Edit event" triggerVariant="ghost">
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
        {/* Pushed to the far end and left in the `danger` wash, away from Edit:
            the two sat side by side in matching ghost text, which is the wrong
            shape for a pair where one is undoable and the other isn't. */}
        <form className="ml-auto" action={deleteEvent.bind(null, tripId, event.id)}>
          <ConfirmSubmit message="Delete this event?">Delete</ConfirmSubmit>
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
