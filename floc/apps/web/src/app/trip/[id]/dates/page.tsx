// Dates tab (#197, #233). Undated is the normal starting state, never an error (rule 9).
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
import { bestWindow, freeDaysByUser, monthOf, thisMonth } from "@floc/core/dates/availability";
import { dateRange, formatDateRange, nightsBetween } from "@floc/core/dates/dates";
import { spanLabel } from "@floc/core/dates/dates-tabs";
import {
  windowCost,
  windowCostLabel,
  windowCostNoun,
} from "@floc/core/trip/trip-window";
import {
  AvatarRow,
  Field,
  Select,
  Stack,
  Textarea,
  menuDangerItemClass,
  PageTitle,
} from "@/components/system/ui";
import {
  ConfirmSubmit,
  Menu,
  Sheet,
  SubmitButton,
} from "@/components/system/client-ui";
import { calendarEnabled } from "@/server/calendar/calendar-import";
import { DatesBoard } from "@/components/availability/dates-board";
import { DatesFold } from "@/components/availability/dates-fold";
import { BestWindowCard } from "@/components/availability/best-window-card";
import { WhoAnswered } from "@/components/availability/who-answered";
import type { GroupAnswer } from "@floc/core/dates/dates-tabs";
import { NUDGE_TABS } from "@/db/schema";
import { TAB_LABELS } from "@/lib/tabs";
import { sendNudge } from "@/app/trip/[id]/overview/actions";
import type { TripMember } from "@/server/access";
import {
  clearMyAvailability,
  clearTripDates,
  fillFromGoogleCalendar,
  removeTripGuest,
  saveAvailability,
  setTripDates,
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
  const [rows, dayLoads, routeDays, forecast, weatherPro, bookingPrefill, guests, docs, sites] = await Promise.all([
    listAvailability(tripId),
    listDayLoads(tripId),
    listRouteDays(tripId),
    // Null → the calendar offers no Weather mode (ticket 148), and always null
    // on a free trip — the gate is inside the read (ticket 248).
    getTripForecast(tripId),
    canUseFeature("dates.weather", tripId),
    canUseFeature("booking.prefill", tripId),
    listGuests(tripId),
    // Rule 11: no storage volume, no files — and no query for them.
    files ? listDocuments(tripId, viewer.id) : Promise.resolve([]),
    bookingSitesOf(viewer.id),
  ]);

  const free = rows.filter((r) => r.available);
  const mine = free.filter((r) => r.userId === viewer.id).map((r) => r.date);

  const tallies: Record<string, number> = {};
  for (const row of free) tallies[row.date] = (tallies[row.date] ?? 0) + 1;
  const marked = freeDaysByUser(rows);

  // Trip's month, else earliest marked month, else now. `?from=` overrides so
  // paging is linkable.
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

  // "Reset dates" cost: an empty window keeps no day, so this is the whole
  // itinerary (ticket 140). Null when there's nothing on it.
  const resetCost = windowCost(dayLoads, null, null);
  const resetNoun = windowCostNoun(resetCost);
  const resetLabel = windowCostLabel(resetCost);

  const best = bestWindow(rows);
  const bestCost = best ? windowCost(dayLoads, best.start, best.end) : null;
  const bestNoun = bestCost && windowCostNoun(bestCost);

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

  const bestCard = best ? (
    <BestWindowCard
      window={best}
      memberCount={members.length + guests.length}
      current={best.start === trip.startDate && best.end === trip.endDate}
      cost={bestNoun ? { noun: bestNoun, label: windowCostLabel(bestCost!)! } : null}
      apply={applyBestWindow.bind(null, tripId, best.start, best.end)}
    />
  ) : null;

  const board = (
    <DatesBoard
      tripId={tripId}
      calendar={
        calendarEnabled()
          ? { fill: fillFromGoogleCalendar.bind(null, tripId), returned: calendar === "fill" || calendar === "refused" ? calendar : null }
          : null
      }
      firstMonth={firstMonth}
      mine={mine}
      tallies={tallies}
      memberCount={members.length + guests.length}
      tripStart={trip.startDate}
      tripEnd={trip.endDate}
      dayLoads={dayLoads}
      weather={forecast}
      weatherLocked={!weatherPro}
      group={group}
      viewerId={viewer.id}
      bestWindow={best}
      slots={{
        faces: <AvatarRow people={answered} size={20} max={4} />,
        best: bestCard,
        who: (
          <WhoAnswered
            members={members}
            marked={marked}
            viewerId={viewer.id}
            nudgeFor={(m) => <NudgeSheet tripId={tripId} member={m} />}
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
        {/*
         * Both verbs always listed, disabled rather than absent, so they're
         * where you look (ticket 133). "Reset dates" confirms because the
         * window is the itinerary's extent (ticket 140); "Clear availability"
         * doesn't — marks paint straight back.
         */}
        <Menu label="Dates actions">
          <form action={clearTripDates.bind(null, tripId)}>
            {resetNoun ? (
              <ConfirmSubmit
                variant="ghost"
                className={menuDangerItemClass}
                message={`Resetting the dates removes the whole itinerary — ${resetNoun}. Notes, costs and people stay.`}
                confirmLabel={resetLabel!}
              >
                Reset dates
              </ConfirmSubmit>
            ) : (
              <SubmitButton
                variant="ghost"
                disabled={!hasDates}
                className={menuDangerItemClass}
              >
                Reset dates
              </SubmitButton>
            )}
          </form>
          <form action={clearMyAvailability.bind(null, tripId)}>
            <SubmitButton
              variant="ghost"
              disabled={mine.length === 0}
              className={menuDangerItemClass}
            >
              Clear availability
            </SubmitButton>
          </form>
        </Menu>
      </header>

      {moment === "finding" ? (
        <div className="mt-6">{board}</div>
      ) : (
        <div className="mt-4">
          <DatesFold>{board}</DatesFold>
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
      <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-faint">The trip</p>
      {start && end ? (
        <>
          <p className="nums mt-1 font-mono text-base text-ink">{spanLabel(start, end)}</p>
          <p className="mt-0.5 text-[13px] text-ink-soft">
            {nightsBetween(start, end)} {nounFor(nightsBetween(start, end), "night")} · {dateRange(start, end).length} {nounFor(dateRange(start, end).length, "day")}
          </p>
        </>
      ) : (
        <p className="mt-1 text-base text-highlight-ink">No dates yet</p>
      )}
    </div>
  );
}

/** Chase a person, not nobody. */
function NudgeSheet({
  tripId,
  member,
}: {
  tripId: number;
  member: TripMember;
}) {
  return (
    <Sheet
      trigger="Nudge"
      triggerVariant="secondary"
      title={`Nudge ${member.name}`}
    >
      {/* Real Server Action ref — a wrapping closure wouldn't survive the boundary. */}
      <form action={sendNudge}>
        <input type="hidden" name="tripId" value={tripId} />
        <input type="hidden" name="toUserId" value={member.userId} />
        <Stack gap={3}>
          <Field label="What's it about">
            <Select name="tab" defaultValue="days">
              {NUDGE_TABS.map((t) => (
                <option key={t} value={t}>
                  {TAB_LABELS[t] ?? t}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Message (optional)">
            <Textarea
              name="message"
            />
          </Field>
          <SubmitButton>Send nudge</SubmitButton>
        </Stack>
      </form>
    </Sheet>
  );
}

/** Any member may remove a guest: a guest is not a member, so this is not an admin power (rule 6, ADR-029). */
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
