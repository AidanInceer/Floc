import { requireTripAccess } from "@/server/access";
import { listAvailability } from "@/server/itinerary/availability";
import { listGuests, type Guest } from "@/server/guests/guests";
import { documentsEnabled } from "@/server/documents/document-store";
import { listDocuments } from "@/server/documents/documents";
import { canUseFeature } from "@/server/billing/entitlements";
import { listDayLoads, listRouteDays } from "@/server/itinerary/itinerary";
import { bookingPlan } from "@floc/core/trip/booking/booking-links";
import { today } from "@floc/core/dates/dates";
import { datesMoment } from "@floc/core/dates/dates-moment";
import { BookingCard } from "@/components/booking/booking-card";
import { bookingSitesOf } from "@/server/auth/booking-sites";
import { getTripForecast } from "@/server/itinerary/weather";
import { freeDaysByUser, monthOf, thisMonth } from "@floc/core/dates/availability";
import { bestDates, windowHeadline, windowReasons } from "@floc/core/dates/finding/best-dates";
import { listLengthChoices } from "@/server/itinerary/trip-length";
import type { BestDate } from "@/components/availability/best-dates-card";
import { dateRange, formatDateRange, nightsBetween } from "@floc/core/dates/dates";
import { spanLabel } from "@floc/core/dates/dates-tabs";
import {
  windowCost,
  windowCostLabel,
  windowCostNoun,
} from "@floc/core/trip/trip-window";
import {
  AvatarRow,
  menuDangerItemClass,
  PageTitle,
} from "@/components/system/ui";
import {
  ConfirmSubmit,
  Menu,
} from "@/components/system/client-ui";
import { calendarEnabled } from "@/server/calendar/calendar-import";
import { calendarAllDayOnly } from "@/server/calendar/calendar-options";
import { DatesBoard } from "@/components/availability/dates-board";
import { AsideHead } from "@/components/availability/dates-board-parts";
import { DatesFold } from "@/components/availability/dates-fold";
import { DatesActions } from "@/components/availability/dates-actions";
import { WhoAnswered } from "@/components/availability/who-answered";
import type { GroupAnswer } from "@floc/core/dates/dates-tabs";
import { NudgeWord } from "@/components/trip/nudge/nudge-word";
import { nudgeTargetsFor } from "@/server/trips/nudges";
import { markedUserIds } from "@floc/core/dates/availability";
import {
  clearMyAvailability,
  clearTripDates,
  fillFromGoogleCalendar,
  keepCalendarAllDayOnly,
  removeTripGuest,
  saveAvailability,
  setTripDates,
  setTripLength,
  applyBestWindow,
} from "./actions";
import { nounFor } from "@floc/core/text/count-word";

export const metadata = { title: "Dates" };

export default async function DatesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; calendar?: string }>;
}) {
  const { id } = await params;
  const { from, calendar } = await searchParams;
  const access = await requireTripAccess(id, `/trip/${id}/dates`);
  const { trip, viewer, members } = access;
  const tripId = trip.id;

  const files = documentsEnabled();
  const [rows, lengths, dayLoads, routeDays, forecast, weatherPro, bookingPrefill, guests, docs, sites, allDayOnly] = await Promise.all([
    listAvailability(tripId),
    listLengthChoices(tripId),
    listDayLoads(tripId),
    listRouteDays(tripId),
    getTripForecast(tripId),
    canUseFeature("dates.weather", tripId),
    canUseFeature("booking.prefill", tripId),
    listGuests(tripId),
    files ? listDocuments(tripId, viewer.id) : Promise.resolve([]),
    bookingSitesOf(viewer.id),
    calendarEnabled() ? calendarAllDayOnly(viewer.id) : Promise.resolve(false),
  ]);

  const free = rows.filter((r) => r.available);
  const mine = free.filter((r) => r.userId === viewer.id).map((r) => r.date);
  const liked = free.filter((r) => r.userId === viewer.id && r.preferred).map((r) => r.date);

  const tallies: Record<string, number> = {};
  for (const row of free) tallies[row.date] = (tallies[row.date] ?? 0) + 1;
  const othersPrefer: Record<string, number> = {};
  for (const row of free) if (row.preferred && row.userId !== viewer.id) othersPrefer[row.date] = (othersPrefer[row.date] ?? 0) + 1;
  const marked = freeDaysByUser(rows);
  const nudges = await nudgeTargetsFor(access, ["dates"], { markedUserIds: markedUserIds(rows) });

  const firstMonth =
    from && /^\d{4}-\d{2}$/.test(from)
      ? from
      : trip.startDate
        ? monthOf(trip.startDate)
        : free.length > 0
          ? monthOf(free.map((r) => r.date).sort((a, b) => a.localeCompare(b))[0])
          : thisMonth();

  const hasDates = !!trip.startDate && !!trip.endDate;
  const moment = datesMoment(trip, today());

  const resetCost = windowCost(dayLoads, null, null);
  const resetNoun = windowCostNoun(resetCost);
  const resetLabel = windowCostLabel(resetCost);

  const names = new Map([...members.map((m) => [m.userId, m.name] as const), ...guests.map((g) => [g.id, g.name] as const)]);
  const windows: BestDate[] = bestDates(rows, lengths, today()).map((w) => {
    const cost = windowCost(dayLoads, w.start, w.end);
    const noun = windowCostNoun(cost);
    return {
      start: w.start,
      end: w.end,
      headline: windowHeadline(w),
      reasons: windowReasons(w, (userId) => names.get(userId) ?? "A guest", viewer.id),
      cost: noun ? { noun, label: windowCostLabel(cost)! } : null,
    };
  });

  const booking = bookingPlan({
    trip,
    days: routeDays.map((d) => ({ ...d, overnightPlaceName: d.placeName })),
    today: today(),
    adults: members.length,
    prefill: bookingPrefill,
    files: docs,
  });

  const answered = members.filter((m) => m.userId in marked);
  const group: GroupAnswer[] = [
    ...members.map((m) => ({ id: m.userId, name: m.name, answered: m.userId in marked })),
    ...guests.map((g) => ({ id: g.id, name: g.name, answered: g.id in marked })),
  ];

  const board = (
    <DatesBoard
      tripId={tripId}
      calendar={
        calendarEnabled()
          ? {
              fill: fillFromGoogleCalendar.bind(null, tripId),
              returned: calendar === "fill" || calendar === "refused" ? calendar : null,
              allDayOnly,
              keepAllDayOnly: keepCalendarAllDayOnly,
            }
          : null
      }
      firstMonth={firstMonth}
      mine={mine}
      liked={liked}
      tallies={tallies}
      othersPrefer={othersPrefer}
      memberCount={members.length + guests.length}
      tripStart={trip.startDate}
      tripEnd={trip.endDate}
      dayLoads={dayLoads}
      weather={forecast}
      weatherLocked={!weatherPro}
      group={group}
      viewerId={viewer.id}
      finder={{
        windows,
        lengths,
        setLength: setTripLength.bind(null, tripId),
        apply: applyBestWindow.bind(null, tripId),
      }}
      slots={{
        faces: <AvatarRow people={answered} size={20} max={3} />,
        who: (
          <WhoAnswered
            members={members}
            marked={marked}
            viewerId={viewer.id}
            nudgeFor={(m) => {
              const person = nudges.dates.find((p) => p.userId === m.userId);
              return person ? <NudgeWord tripId={tripId} task="dates" person={person} /> : null;
            }}
            guests={guests}
            removeGuestFor={(g) => <RemoveGuest tripId={tripId} guest={g} />}
          />
        ),
        trip: <TripBlock start={trip.startDate} end={trip.endDate} />,
        locked: (
          <p className="p-4 text-sm text-ink-soft">
            The weather on each of the trip&apos;s days comes with Floc Pro.
          </p>
        ),
      }}
      save={saveAvailability.bind(null, tripId)}
      saveDates={setTripDates.bind(null, tripId)}
    />
  );

  const actions = (
    <DatesActions
      reset={clearTripDates.bind(null, tripId)}
      clear={clearMyAvailability.bind(null, tripId)}
      resetCost={
        resetNoun
          ? { message: `Resetting the dates removes the whole itinerary — ${resetNoun}. Notes, costs and people stay.`, label: resetLabel! }
          : null
      }
      hasDates={hasDates}
      hasMarks={mine.length > 0}
    />
  );

  return (
    <div className="mx-auto w-full max-w-[84rem] px-4 pb-20 pt-6 sm:px-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <PageTitle className="sr-only">Dates</PageTitle>
          <p className="text-sm text-ink-soft">
            {hasDates ? (
              <>
                <span className="nums text-ink">
                  {formatDateRange(trip.startDate, trip.endDate)}
                </span>{" "}
                · {nightsBetween(trip.startDate!, trip.endDate!)} {nounFor(nightsBetween(trip.startDate!, trip.endDate!), "night")}
              </>
            ) : (
              "No dates yet"
            )}
          </p>
        </div>
      </header>

      {moment === "finding" ? (
        <>
          <div className="mt-6">{board}</div>
          <div className="mt-3">{actions}</div>
        </>
      ) : (
        <div className="mt-4">
          <DatesFold aside={actions}>{board}</DatesFold>
        </div>
      )}
      {booking ? (
        <div className="mt-4">
          <BookingCard tripId={tripId} plan={booking} files={files} sites={sites} />
        </div>
      ) : null}
    </div>
  );
}

function TripBlock({ start, end }: { start: string | null; end: string | null }) {
  return (
    <div className="p-4">
      <AsideHead title="The trip" />
      {start && end ? (
        <>
          <p className="nums mt-1 font-mono text-base text-ink">{spanLabel(start, end)}</p>
          <p className="mt-0.5 text-[13px] text-ink-soft">
            {nightsBetween(start, end)} {nounFor(nightsBetween(start, end), "night")} · {dateRange(start, end).length} {nounFor(dateRange(start, end).length, "day")}
          </p>
        </>
      ) : (
        <p className="mt-1 text-[13px] text-highlight-ink">No dates yet</p>
      )}
    </div>
  );
}
function RemoveGuest({ tripId, guest }: { tripId: number; guest: Guest }) {
  return (
    <Menu label={`${guest.name} actions`}>
      <form action={removeTripGuest.bind(null, tripId, guest.id)}>
        <ConfirmSubmit
          variant="ghost"
          className={menuDangerItemClass}
          message={`Remove ${guest.name}? Their votes and days go for good.`}
          confirmLabel="Remove"
        >
          Remove guest
        </ConfirmSubmit>
      </form>
    </Menu>
  );
}
