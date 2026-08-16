/**
 * Dates tab — the surface that decides a trip's window (undated is the normal
 * start, rule 9): everyone paints days they could do, the group view shows the
 * overlap, one form commits. Never waits for a full house.
 */
import { requireTripAccess } from "@/server/access";
import { listAvailability } from "@/server/membership";
import { listDayLoads } from "@/server/itinerary";
import { getTripForecast } from "@/server/weather";
import { monthOf, thisMonth } from "@/lib/availability";
import { formatDateRange, nightsBetween } from "@/lib/dates";
import {
  windowCost,
  windowCostLabel,
  windowCostNoun,
} from "@/lib/trip-window";
import {
  AvatarRow,
  Card,
  CardHeader,
  Page,
  PageHeader,
  Stack,
} from "@/components/ui";
import {
  ConfirmSubmit,
  Menu,
  SubmitButton,
  menuDangerItemClass,
} from "@/components/client-ui";
import { AvailabilityCalendar } from "@/components/availability-calendar";
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

  const [rows, dayLoads, forecast] = await Promise.all([
    listAvailability(tripId),
    listDayLoads(tripId),
    // Null → the calendar offers no Weather mode (ticket 148).
    getTripForecast(tripId),
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
    <Page wide flush>
      {/* The window is the page headline, not a card of its own (ticket 128). */}
      <PageHeader
        title="Dates"
        subtitle={
          hasDates ? (
            // Same 14px as the undated line: a larger range shifted the whole
            // page down on commit/clear (ticket 133).
            <>
              <span className="nums text-ink">
                {formatDateRange(trip.startDate, trip.endDate)}
              </span>{" "}
              <span className="text-ink-faint">
                ({nightsBetween(trip.startDate!, trip.endDate!)} nights)
              </span>
            </>
          ) : (
            "Not settled yet — mark the days you could go."
          )
        }
      />

      <Stack gap={6}>
        <Card>
          <CardHeader
            title="Who can do when"
            hint="Your own days, or the whole group's overlap."
            // Who's-still-to-answer + menu live on the always-present header, so
            // answering can't push the page around (ticket 133).
            actions={
              <div className="flex items-center gap-3">
                {waitingOn.length > 0 ? (
                  <div className="flex items-center gap-2">
                    {/* `leading-none`: the mono label's own line-height sat the
                        caps above the row's middle. */}
                    <span className="typed leading-none text-ink-faint">
                      Still to say
                    </span>
                    <AvatarRow
                      people={waitingOn.map((m) => ({
                        name: m.name,
                        avatarUrl: m.avatarUrl,
                        tone: m.tone,
                      }))}
                      size={26}
                    />
                  </div>
                ) : null}
                {/*
                 * Both verbs always listed, disabled rather than absent, so
                 * they're where you look (ticket 133).
                 *
                 * "Reset dates" confirms because the window is the itinerary's
                 * extent — resetting takes every day and event with it, which
                 * setting the dates again can't undo (ticket 140). The dialog
                 * only appears when there's something to lose. "Clear
                 * availability" doesn't: marks paint straight back.
                 */}
                <Menu label="Dates actions">
                  <form action={clearTripDates.bind(null, tripId)}>
                    {resetNoun ? (
                      <ConfirmSubmit
                        variant="ghost"
                        className={menuDangerItemClass}
                        message={`Resetting the dates removes the whole itinerary — ${resetNoun}. Ideas, costs and people stay.`}
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
              </div>
            }
          />
          <div className="p-4">
            {/* No "best overlap so far" line — the green run is the overlap
                (ticket 134, show-don't-narrate). */}
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
              save={saveAvailability.bind(null, tripId)}
              saveDates={setTripDates.bind(null, tripId)}
            />
          </div>
        </Card>
      </Stack>
    </Page>
  );
}
