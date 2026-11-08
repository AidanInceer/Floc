/**
 * Days page (ticket 15, re-imagined as a calendar by ticket 103, a focus day since B5). The only
 * route over the `day` + `day_event` dataset — Route was retired by ticket
 * 142, its map/stop-list now at the foot of Overview, and the overnight place
 * is set here on the band above the clock (ticket 141).
 *
 * `components/days-calendar.tsx` is a Client Component owning geometry and
 * gestures; this stays a Server Component owning every Server Action — the
 * selected event's panel, adding/removing a day — passed over as pre-rendered
 * nodes so mutations stay on the server.
 *
 * Notes hang off *events*, not days (a free-text per-day box had no clear use);
 * trip-wide talk lives on the Notes page now, not here (ticket 321).
 *
 * Each event category has its own colour (ticket 68) via `EVENT_CATEGORIES`,
 * with the word always present too — colour is never the only signal. A
 * flight event offers a Google Flights deep link only (ticket 10).
 */
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
import { CalendarMenu } from "@/components/days/calendar-menu";
import {
  DaysCalendar,
  type CalendarDay,
  type CalendarEvent,
} from "@/components/days/days-calendar";
import { EventFiles } from "@/components/documents/event-files";
import type { FileChoice } from "@/components/documents/attach-existing";
import { EventForm } from "@/components/days/event-form";
import { ButtonLink, EmptyState, PageTitle, cx, menuDangerItemClass, panelBandClass, panelTitleClass } from "@/components/system/ui";
import { calendarFeedUrlFor } from "@/server/itinerary/feed/calendar-feed-link";
import { EVENT_CATEGORIES } from "@floc/core/itinerary/event-categories";
import { NoteThread, type NoteRow, type Viewer } from "@/components/notes/note-thread";
import { requireTripAccess, type TripMember } from "@/server/access";
import { canUseFeature } from "@/server/billing/entitlements";
import type { DayEventRow } from "@/server/itinerary/itinerary";
import { loadCalendar } from "@/server/itinerary/calendar-read";
import type { TripDocument } from "@/server/documents/documents";
import { documentsEnabled } from "@/server/documents/document-store";
import { addDays as addDaysToDate, fromIsoDate, today } from "@floc/core/dates/dates";
import { eventFlightLinks } from "@floc/core/trip/booking/booking-links";
import { BookingSitesProvider } from "@/components/booking/booking-sites";
import { SitePicker } from "@/components/booking/site-picker";
import { bookingSitesOf } from "@/server/auth/booking-sites";

export const metadata = { title: "Days" };

export default async function DaysPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ event?: string; date?: string }>;
}) {
  const { id } = await params;
  const access = await requireTripAccess(id, `/trip/${id}/days`);
  const { trip, viewer, members } = access;

  const query = await searchParams;
  const openEventId = Number(query.event) || null;
  const [calendar, bookingPrefill, sites, feedUrl] = await Promise.all([
    loadCalendar(access, openEventId),
    canUseFeature("booking.prefill", trip.id),
    bookingSitesOf(viewer.id),
    calendarFeedUrlFor(trip.id, viewer.id),
  ]);
  const { days, commentCounts, fileEventIds, selected } = calendar;
  const commenter = commenterOf(viewer, members);

  if (days.length === 0) {
    // Two empty states (ticket 126): an undated trip is sent to Dates rather
    // than offered "Add the first day", which would otherwise seed from
    // `today()` — a January trip picking up an August day it never asked for
    // (rule 9: undated is normal, never an error).
    return (
      <div className="mx-auto w-full max-w-[84rem] px-4 pb-20 pt-6 sm:px-6">
        <PageTitle className="sr-only">Days</PageTitle>
        <div>
        {trip.startDate ? (
          <EmptyState
            title="No days yet"
            action={
              <form action={addDays.bind(null, trip.id, addDaysToDate(trip.startDate, -1), 1)}>
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
    shortLabel: partOf(d.date, { weekday: "short", day: "numeric", month: "short" }),
    overnightPlaceName: d.overnightPlaceName,
    overnightPlaceId: d.overnightPlaceId,
    outside: false,
    isToday: d.date === now,
  }));

  const calendarEvents: CalendarEvent[] = [];
  for (const d of days) {
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
        note: event.note,
        hasFiles: fileEventIds.has(event.id),
        commentCount: commentCounts.get(event.id) ?? 0,
      });
    }
  }

  const removeDayControls = Object.fromEntries(
    days.map((d) => [
      d.id,
      <form key={d.id} action={removeDay.bind(null, trip.id, d.id)}>
        <ConfirmSubmit
          message="Remove this day? Its events go with it."
          variant="ghost"
          className={menuDangerItemClass}
        >
          Remove day
        </ConfirmSubmit>
      </form>,
    ]),
  );

  return (
    <div className="mx-auto w-full max-w-[84rem] px-4 pb-20 pt-6 sm:px-6">
      <header className="flex flex-wrap items-end justify-end gap-6">
        <PageTitle className="sr-only">Days</PageTitle>
        <CalendarMenu
          downloadHref={`/trip/${trip.id}/calendar.ics`}
          tripId={trip.id}
          feedUrl={feedUrl ?? ""}
        />
      </header>

      <div className="mt-8">
      <BookingSitesProvider initial={sites}>
      <DaysCalendar
        days={calendarDays}
        events={calendarEvents}
        panel={selected ? {
          eventId: selected.event.id,
          content: <EventPanel
            tripId={trip.id}
            dayId={selected.day.id}
            date={selected.day.date}
            event={selected.event}
            originPlaceName={days[days.indexOf(selected.day) - 1]?.overnightPlaceName ?? null}
            destinationPlaceName={selected.day.overnightPlaceName}
            notes={selected.notes}
            files={selected.files}
            loose={selected.loose}
            filesEnabled={documentsEnabled()}
            viewer={commenter}
            bookingPrefill={bookingPrefill}
          />,
        } : null}
        removeDayControls={removeDayControls}
        submitEvent={submitEvent.bind(null, trip.id)}
        rescheduleEvent={rescheduleEvent.bind(null, trip.id)}
        moveEventToDay={moveEventToAnotherDay.bind(null, trip.id)}
        setOvernight={setDayOvernight.bind(null, trip.id)}
        searchPlaces={searchPlacesAction}
        openEventId={selected?.event.id ?? null}
        initialDate={query.date}
        groupSize={members.length}
        bookingPrefill={bookingPrefill}
      />
      </BookingSitesProvider>
      </div>
    </div>
  );
}

/** You, as the comment composer draws you: your trip colour and face, as on every other tab. */
function commenterOf(viewer: { id: string; name: string }, members: TripMember[]): Viewer {
  const me = members.find((m) => m.userId === viewer.id);
  return { id: viewer.id, name: me?.name ?? viewer.name, icon: me?.avatarIcon ?? null, tone: me?.tone };
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
  viewer,
  bookingPrefill,
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
  viewer: Viewer;
  bookingPrefill: boolean;
}) {
  const isTransport = event.type === "transport";
  const from = originPlaceName ?? event.placeName ?? "";
  const to = destinationPlaceName ?? event.placeName ?? "";
  // Why: on a trip's first day both ends fall back to the event's own place, and "Lisbon to Lisbon" says nothing.
  const flightTitle = from && to && from !== to ? `Search flights, ${from} to ${to}` : "Search flights";
  const flightLinks =
    isTransport && event.transportType === "flight"
      ? eventFlightLinks({
          origin: from,
          destination: to,
          date,
          prefill: bookingPrefill,
        })
      : null;

  return (
    <div>
      {/* The facts edit in place and save on change (ticket 321). The form's head is
          the block itself, so the type needs no badge of its own. */}
      <EventForm
        autosave
        action={submitEvent.bind(null, tripId)}
        searchPlaces={searchPlacesAction}
        dateLabel={partOf(date, { weekday: "short", day: "numeric", month: "short" })}
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

      <div>
        {flightLinks ? (
          <section aria-label={flightTitle} className={panelBandClass}>
            <p className={cx(panelTitleClass, "mb-2")}>{flightTitle}</p>
            <SitePicker kind="flights" links={flightLinks} label={flightTitle} head={partOf(date, { weekday: "short", day: "numeric", month: "short" })} />
          </section>
        ) : null}

        {filesEnabled ? (
          <EventFiles
            tripId={tripId}
            dayEventId={event.id}
            files={files}
            loose={loose}
            viewerId={viewer.id}
          />
        ) : null}

        <div className={panelBandClass}>
          <NoteThread
            tripId={tripId}
            scope="day_event"
            scopeId={event.id}
            notes={notes}
            viewer={viewer}
          />
        </div>
      </div>

      <form action={deleteEvent.bind(null, tripId, event.id)} className="border-t border-rule px-2 py-1.5">
        <ConfirmSubmit message="Delete this event?" variant="ghost" className={menuDangerItemClass}>
          Delete event
        </ConfirmSubmit>
      </form>
    </div>
  );
}
