// Dates tab (#197, #233). Undated is the normal starting state, never an error (rule 9).
import { requireTripAccess } from "@/server/access";
import { listAvailability } from "@/server/itinerary/availability";
import { canUseFeature } from "@/server/billing/entitlements";
import { listDayLoads, listRouteDays } from "@/server/itinerary/itinerary";
import { bookingPlan } from "@floc/core/trip/booking-links";
import { today } from "@floc/core/dates/dates";
import { BookingCard } from "@/components/booking/booking-card";
import { getTripForecast } from "@/server/itinerary/weather";
import { bestWindow, monthOf, thisMonth } from "@floc/core/dates/availability";
import { formatDateRange, nightsBetween } from "@floc/core/dates/dates";
import {
  windowCost,
  windowCostLabel,
  windowCostNoun,
} from "@floc/core/trip/trip-window";
import {
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
import { AvailabilityCalendar } from "@/components/availability/availability-calendar";
import { BestWindowCard } from "@/components/availability/best-window-card";
import { WhoAnswered } from "@/components/availability/who-answered";
import { NUDGE_TABS } from "@/db/schema";
import { TAB_LABELS } from "@/lib/tabs";
import { sendNudge } from "@/app/trip/[id]/overview/actions";
import type { TripMember } from "@/server/access";
import {
  clearMyAvailability,
  clearTripDates,
  saveAvailability,
  setTripDates,
} from "./actions";

const MONTHS_SHOWN = 1; // one month, arrows page the rest

export default async function DatesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
  const access = await requireTripAccess(id, `/trip/${id}/dates`);
  const { trip, viewer, members } = access;
  const tripId = trip.id;

  const [rows, dayLoads, routeDays, forecast, weatherPro, bookingPrefill] = await Promise.all([
    listAvailability(tripId),
    listDayLoads(tripId),
    listRouteDays(tripId),
    // Null → the calendar offers no Weather mode (ticket 148), and always null
    // on a free trip — the gate is inside the read (ticket 248).
    getTripForecast(tripId),
    canUseFeature("dates.weather", tripId),
    canUseFeature("booking.prefill", tripId),
  ]);

  const free = rows.filter((r) => r.available);
  const mine = free.filter((r) => r.userId === viewer.id).map((r) => r.date);

  const tallies: Record<string, number> = {};
  const marked: Record<string, number> = {};
  for (const row of free) {
    tallies[row.date] = (tallies[row.date] ?? 0) + 1;
    marked[row.userId] = (marked[row.userId] ?? 0) + 1;
  }

  // Trip's month, else earliest marked month, else now. `?from=` overrides so
  // paging is linkable.
  const firstMonth =
    from && /^\d{4}-\d{2}$/.test(from)
      ? from
      : trip.startDate
        ? monthOf(trip.startDate)
        : free.length > 0
          ? monthOf(free.map((r) => r.date).sort()[0])
          : thisMonth();

  const hasDates = !!trip.startDate && !!trip.endDate;

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
  });

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-20 pt-6 sm:px-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <PageTitle>Dates</PageTitle>
          <p className="mt-1 text-sm text-ink-soft">
            {hasDates ? (
              <>
                <span className="nums text-ink">
                  {formatDateRange(trip.startDate, trip.endDate)}
                </span>{" "}
                · {nightsBetween(trip.startDate!, trip.endDate!)} nights
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
                pendingLabel="Resetting…"
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

      <div className="mt-6 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        {/* Why: `contents` below lg flattens both columns into one, so `order` can put the set dates straight under the calendar. */}
        <div className="contents min-w-0 lg:flex lg:flex-col lg:gap-4">
          <div className="order-1 min-w-0">
            <AvailabilityCalendar
              firstMonth={firstMonth}
              monthCount={MONTHS_SHOWN}
              mine={mine}
              tallies={tallies}
              memberCount={members.length}
              tripStart={trip.startDate}
              tripEnd={trip.endDate}
              dayLoads={dayLoads}
              weather={forecast}
              weatherLocked={!weatherPro}
              save={saveAvailability.bind(null, tripId)}
              saveDates={setTripDates.bind(null, tripId)}
            />
          </div>
          {booking ? (
            <div className="order-3">
              <BookingCard tripId={tripId} plan={booking} />
            </div>
          ) : null}
        </div>

        <aside className="contents lg:flex lg:flex-col lg:gap-4">
          {best ? (
            <div className="order-2">
              <BestWindowCard
                window={best}
                memberCount={members.length}
                current={
                  best.start === trip.startDate && best.end === trip.endDate
                }
                cost={
                  bestNoun
                    ? { noun: bestNoun, label: windowCostLabel(bestCost!)! }
                    : null
                }
                apply={setTripDates.bind(null, tripId, best.start, best.end)}
              />
            </div>
          ) : null}
          <div className="order-4">
            <WhoAnswered
              members={members}
              marked={marked}
              viewerId={viewer.id}
              nudgeFor={(m) => <NudgeSheet tripId={tripId} member={m} />}
            />
          </div>
        </aside>
      </div>
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
              placeholder={`e.g. "Can you mark your days before the weekend?"`}
            />
          </Field>
          <SubmitButton pendingLabel="Sending…">Send nudge</SubmitButton>
        </Stack>
      </form>
    </Sheet>
  );
}
