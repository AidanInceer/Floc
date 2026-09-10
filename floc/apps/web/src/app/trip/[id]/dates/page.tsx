/**
 * Dates tab (redesigned 197, narrowed 233) — the surface that settles a trip's
 * window. One centred calendar: paint the days you could go, then set the trip
 * window from the same grid. Undated is the normal starting state, never an
 * error (rule 9).
 */
import { requireTripAccess } from "@/server/access";
import { listAvailability } from "@/server/itinerary/availability";
import { canUseFeature } from "@/server/billing/entitlements";
import { listDayLoads } from "@/server/itinerary/itinerary";
import { getTripForecast } from "@/server/itinerary/weather";
import { monthOf, thisMonth } from "@floc/core/availability";
import { formatDateRange, nightsBetween } from "@floc/core/dates";
import { windowCost, windowCostLabel, windowCostNoun } from "@floc/core/trip-window";
import { Avatar, Field, Select, Stack, Textarea, menuDangerItemClass } from "@/components/system/ui";
import { ConfirmSubmit, Menu, Sheet, SubmitButton } from "@/components/system/client-ui";
import { AvailabilityCalendar } from "@/components/availability/availability-calendar";
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

  const [rows, dayLoads, forecast, weatherPro] = await Promise.all([
    listAvailability(tripId),
    listDayLoads(tripId),
    // Null → the calendar offers no Weather mode (ticket 148), and always null
    // on a free trip — the gate is inside the read (ticket 248).
    getTripForecast(tripId),
    canUseFeature("dates.weather", tripId),
  ]);

  const free = rows.filter((r) => r.available);
  const mine = free.filter((r) => r.userId === viewer.id).map((r) => r.date);

  const tallies: Record<string, number> = {};
  for (const row of free) tallies[row.date] = (tallies[row.date] ?? 0) + 1;

  const answered = new Set(free.map((r) => r.userId));
  const waitingOn = members.filter((m) => !answered.has(m.userId));

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

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-20 pt-6 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="text-[clamp(1.9rem,4vw,2.8rem)]">Dates</h1>
          <p className="mt-3 text-md text-ink-soft">
            {hasDates ? (
              <>
                <span className="nums text-ink">
                  {formatDateRange(trip.startDate, trip.endDate)}
                </span>{" "}
                <span className="text-ink-faint">
                  ({nightsBetween(trip.startDate!, trip.endDate!)} nights)
                </span>
              </>
            ) : (
              "Nothing settled yet — paint the days you could go."
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

      <div className="mt-8 flex flex-col gap-4">
        <section className="rounded-lg bg-peri p-6 text-peri-ink">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-xl">Who can do when</h2>
            <span className="typed text-current">
              {mine.length === 0
                ? "Paint your own days"
                : `${mine.length} ${mine.length === 1 ? "day" : "days"} marked by you`}
            </span>
          </div>
          <div className="mt-4">
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
        </section>

        {waitingOn.length > 0 ? (
          <StillToSay tripId={tripId} people={waitingOn} />
        ) : null}
      </div>
    </div>
  );
}

/** Who hasn't answered, named — so the group chases a person, not nobody. */
function StillToSay({
  tripId,
  people,
}: {
  tripId: number;
  people: TripMember[];
}) {
  return (
    <section className="rounded-lg bg-butter p-6 text-butter-ink">
      <h2 className="text-xl">Still to say</h2>
      <ul className="mt-3 flex flex-col gap-2">
        {people.map((m) => (
          <li
            key={m.userId}
            className="flex flex-wrap items-center gap-2 rounded-md bg-sheet/70 px-3 py-2"
          >
            <Avatar name={m.name} src={m.avatarUrl} size={24} tone={m.tone} />
            <span className="min-w-0 flex-1 truncate text-sm">{m.name}</span>
            <Sheet
              trigger="Nudge"
              triggerVariant="secondary"
              title={`Nudge ${m.name}`}
            >
              {/* Real Server Action ref — a wrapping closure wouldn't survive
                  the boundary. */}
              <form action={sendNudge}>
                <input type="hidden" name="tripId" value={tripId} />
                <input type="hidden" name="toUserId" value={m.userId} />
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
          </li>
        ))}
      </ul>
    </section>
  );
}
