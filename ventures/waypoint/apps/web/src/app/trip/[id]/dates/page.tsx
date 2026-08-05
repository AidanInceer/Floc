/**
 * Dates tab — where a trip stops being "sometime in the spring".
 *
 * A trip is allowed to exist with no dates at all (`trip.start_date` is
 * nullable, and creating one without them is the normal case), so this is the
 * surface that decides them: everyone paints the days they could do, the group
 * view shows where that overlaps, and one form commits a window. It does not
 * wait for a full house — see `bestWindow`.
 *
 * Availability used to be a three-column table at the bottom of the Ideas tab
 * with a one-date-at-a-time `<input type="date">`; it moved here whole.
 */
import { requireTripAccess } from "@/server/access";
import { listAvailability } from "@/server/membership";
import { bestWindow, monthOf, thisMonth } from "@/lib/availability";
import { formatDate, formatDateRange, nightsBetween } from "@/lib/dates";
import {
  AvatarRow,
  Card,
  CardHeader,
  Page,
  PageHeader,
  Stack,
} from "@/components/ui";
import {
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

/** Three months at a time — enough to see a season without endless paging. */
const MONTHS_SHOWN = 3;

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

  const rows = await listAvailability(tripId);

  const free = rows.filter((r) => r.available);
  const mine = free.filter((r) => r.userId === viewer.id).map((r) => r.date);

  const tallies: Record<string, number> = {};
  for (const row of free) tallies[row.date] = (tallies[row.date] ?? 0) + 1;

  const suggestion = bestWindow(rows);
  const answered = new Set(free.map((r) => r.userId));
  const waitingOn = members.filter((m) => !answered.has(m.userId));

  // Open on the trip's own month once it has one, otherwise on the earliest
  // month anybody has marked, otherwise on now. `?from=` overrides all three
  // so paging is linkable.
  const firstMonth =
    from && /^\d{4}-\d{2}$/.test(from)
      ? from
      : trip.startDate
        ? monthOf(trip.startDate)
        : free.length > 0
          ? monthOf(free.map((r) => r.date).sort()[0])
          : thisMonth();

  const hasDates = !!trip.startDate && !!trip.endDate;

  return (
    <Page wide flush>
      {/*
       * The dates are the page's headline, not a card of their own (ticket
       * 128). There was a "The dates" panel above the calendar holding a range
       * and a nights count; a whole bordered card to say eight words, directly
       * above the calendar that sets them. The window belongs in the header
       * with the title, where you read it without being asked to.
       */}
      <PageHeader
        title="Dates"
        subtitle={
          hasDates ? (
            /*
             * Same 14px as the undated line, not a larger one (ticket 133).
             * A `text-base` range made the header a couple of pixels taller
             * than "Not settled yet…", so committing or clearing the dates
             * nudged the whole page down — a layout shift as the answer to
             * a click that was about the dates, not about the page.
             */
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
            /*
             * Everything that hangs off the calendar sits on the calendar's
             * own header (ticket 133): who hasn't answered, then the menu.
             *
             * The waiting-on list used to be a second card below this one,
             * which appeared and disappeared as people answered and moved
             * the page under whoever was mid-decision. As a line of faces on
             * a header that is always there, it can't push anything.
             */
            actions={
              <div className="flex items-center gap-3">
                {waitingOn.length > 0 ? (
                  <div className="flex items-center gap-2">
                    {/* `leading-none`, and faces the same 26px as the menu
                        trigger beside them: the mono label carries its own
                        line-height, which left the caps sitting a pixel or
                        two above the middle of the row. */}
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
                 * Always rendered, both verbs always listed — disabled when
                 * there is nothing to undo rather than absent (ticket 133).
                 * A control that comes and goes has to be hunted for; one
                 * that is always in the same corner is somewhere you look.
                 *
                 * No confirm dialog behind either: opening a menu and picking
                 * a named verb is already deliberate, and neither loses
                 * anything you can't put back by marking the days again or
                 * setting the dates again.
                 */}
                <Menu label="Dates actions">
                  <form action={clearTripDates.bind(null, tripId)}>
                    <SubmitButton
                      variant="ghost"
                      disabled={!hasDates}
                      className={menuDangerItemClass}
                    >
                      Reset dates
                    </SubmitButton>
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
            {suggestion ? (
              <p className="mb-3 text-xs text-ink-faint">
                Best overlap so far:{" "}
                <span className="nums text-ink-soft">
                  {suggestion.start === suggestion.end
                    ? formatDate(suggestion.start)
                    : `${formatDate(suggestion.start)} – ${formatDate(suggestion.end)}`}
                </span>{" "}
                — {suggestion.free} of {members.length} free.
              </p>
            ) : null}
            <AvailabilityCalendar
              firstMonth={firstMonth}
              monthCount={MONTHS_SHOWN}
              mine={mine}
              tallies={tallies}
              memberCount={members.length}
              tripStart={trip.startDate}
              tripEnd={trip.endDate}
              save={saveAvailability.bind(null, tripId)}
              saveDates={setTripDates.bind(null, tripId)}
            />
          </div>
        </Card>
      </Stack>
    </Page>
  );
}
