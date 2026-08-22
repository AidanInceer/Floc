/**
 * Dates tab (redesigned 197) — the surface that settles a trip's window.
 *
 * Two halves that talk to each other: the calendar where everyone paints the
 * days they could go, and beside it the runs of days that actually work, each
 * naming who it would lose. Paint a day and the shortlist moves. Undated is the
 * normal starting state, never an error (rule 9).
 */
import { requireTripAccess } from "@/server/access";
import { listAvailability } from "@/server/membership";
import { listDayLoads } from "@/server/itinerary";
import { getTripForecast } from "@/server/weather";
import { candidateRuns, monthOf, thisMonth } from "@/lib/availability";
import type { CandidateRun } from "@/lib/availability";
import { formatDate, formatDateRange, nightsBetween } from "@/lib/dates";
import { windowCost, windowCostLabel, windowCostNoun } from "@/lib/trip-window";
import { Avatar, Badge, Field, Select, Stack, Textarea, cx } from "@/components/ui";
import {
  ConfirmSubmit,
  Menu,
  Sheet,
  SubmitButton,
  menuDangerItemClass,
} from "@/components/client-ui";
import { AvailabilityCalendar } from "@/components/availability-calendar";
import { NUDGE_TABS } from "@/db/schema";
import { sendNudge } from "@/app/trip/[id]/overview/actions";
import type { TripMember } from "@/server/access";
import type { DayLoad } from "@/lib/trip-window";
import {
  clearMyAvailability,
  clearTripDates,
  saveAvailability,
  setTripDates,
} from "./actions";

const MONTHS_SHOWN = 1; // one month, arrows page the rest

const TAB_LABELS: Record<string, string> = {
  ideas: "Ideas",
  route: "Route",
  days: "Days",
  money: "Money",
};

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

  const runs = candidateRuns(
    rows,
    members.map((m) => m.userId),
  );
  const memberById = new Map(members.map((m) => [m.userId, m]));

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
    <div className="mx-auto w-full max-w-[84rem] px-4 pb-20 pt-6 sm:px-6">
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
              "Nothing settled yet — paint the days you could go, and the runs that work appear beside the calendar."
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
      </header>

      <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,58fr)_minmax(0,42fr)] lg:items-start">
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
            {/* No "best overlap so far" line — the shortlist beside this is the
                overlap (ticket 134, show-don't-narrate). */}
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
        </section>

        <div className="flex flex-col gap-4">
          <Shortlist
            tripId={tripId}
            runs={runs}
            memberCount={members.length}
            memberById={memberById}
            dayLoads={dayLoads}
            current={hasDates ? { start: trip.startDate!, end: trip.endDate! } : null}
          />
          {waitingOn.length > 0 ? (
            <StillToSay tripId={tripId} people={waitingOn} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

/**
 * The runs worth arguing about. The one that loses nobody is the only green-lit
 * row — every other run is a trade, and says whose.
 */
function Shortlist({
  tripId,
  runs,
  memberCount,
  memberById,
  dayLoads,
  current,
}: {
  tripId: number;
  runs: CandidateRun[];
  memberCount: number;
  memberById: Map<string, TripMember>;
  dayLoads: DayLoad[];
  current: { start: string; end: string } | null;
}) {
  return (
    <section className="rounded-lg bg-sheet p-6">
      <h2 className="text-xl">What actually works</h2>
      {runs.length === 0 ? (
        <p className="mt-3 text-sm text-ink-soft">
          Nobody has painted a day yet. The runs of days the group can do will
          be listed here as answers come in — one row per option, with whoever
          it would leave behind.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {runs.map((run) => {
            const everyone = run.missing.length === 0 && memberCount > 0;
            const chosen =
              current !== null &&
              current.start === run.start &&
              current.end === run.end;
            const cost = windowCost(dayLoads, run.start, run.end);
            const noun = windowCostNoun(cost);
            const label = windowCostLabel(cost);
            const commit = setTripDates.bind(null, tripId, run.start, run.end);

            return (
              <li
                key={`${run.start}:${run.end}`}
                className={cx(
                  "rounded-md p-4",
                  everyone
                    ? "bg-mint text-mint-ink"
                    : "bg-sheet-2 shadow-[inset_0_0_0_1.5px_var(--rule)]",
                )}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="nums text-sm font-semibold">
                    {formatDate(run.start)} &ndash; {formatDate(run.end)}
                  </p>
                  <span className="nums text-xs opacity-70">
                    {run.nights} {run.nights === 1 ? "night" : "nights"}
                  </span>
                </div>

                <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                  {everyone ? (
                    <Badge tone="agreed">Everyone can do this</Badge>
                  ) : (
                    <>
                      <span className="opacity-75">
                        Without{" "}
                        {run.missing
                          .map((u) => memberById.get(u)?.name ?? "someone")
                          .join(", ")}
                      </span>
                      <span className="flex">
                        {run.missing.map((u, i) => {
                          const m = memberById.get(u);
                          return (
                            <span key={u} className={cx(i > 0 && "-ml-1.5")}>
                              <Avatar
                                name={m?.name ?? "Someone"}
                                src={m?.avatarUrl ?? null}
                                size={20}
                                tone={m?.tone}
                              />
                            </span>
                          );
                        })}
                      </span>
                    </>
                  )}
                </p>

                <div className="mt-3">
                  {chosen ? (
                    <span className="typed">These are the dates</span>
                  ) : (
                    // Committing still says what the window would cost before
                    // the click (ticket 140).
                    <form action={commit}>
                      {noun ? (
                        <ConfirmSubmit
                          variant="primary"
                          message={`Moving the window to ${formatDate(run.start)} – ${formatDate(run.end)} drops ${noun}. Ideas, costs and people stay.`}
                          confirmLabel={label!}
                          pendingLabel="Setting…"
                        >
                          Use these dates
                        </ConfirmSubmit>
                      ) : (
                        <SubmitButton variant="primary" pendingLabel="Setting…">
                          Use these dates
                        </SubmitButton>
                      )}
                    </form>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
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
