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
  Avatar,
  Badge,
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
            <>
              <span className="nums text-base text-ink">
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
        /*
         * Both resets behind one triple-dot (ticket 125's pattern, applied
         * here by ticket 132). "Clear dates" sat in this header and "Start
         * again" in the calendar's, two ghost buttons a hand's width apart,
         * each rarely wanted and each competing with the grid that is what
         * the page is for. One affordance shows; the verbs are revealed on
         * demand.
         */
        actions={
          hasDates || mine.length > 0 ? (
            <Menu label="Dates actions">
              {/* No confirm dialog behind either of these. Opening a menu and
                  picking a named verb is already deliberate, and neither loses
                  anything you can't put back by marking the days again or
                  setting the dates again — a modal to confirm that is a second
                  click for nothing. */}
              {hasDates ? (
                <form action={clearTripDates.bind(null, tripId)}>
                  <SubmitButton variant="ghost" className={menuDangerItemClass}>
                    Clear the trip&rsquo;s dates
                  </SubmitButton>
                </form>
              ) : null}
              {mine.length > 0 ? (
                <form action={clearMyAvailability.bind(null, tripId)}>
                  <SubmitButton variant="ghost" className={menuDangerItemClass}>
                    Clear the days I marked
                  </SubmitButton>
                </form>
              ) : null}
            </Menu>
          ) : undefined
        }
      />

      <Stack gap={6}>
        <Card>
          <CardHeader
            title="Who can do when"
            hint="Your own days, or the whole group's overlap."
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

        {waitingOn.length > 0 ? (
          <Card>
            <CardHeader
              title="Still to say"
              hint="Not a blocker — the dates can be set without them."
            />
            <ul className="flex flex-col gap-2 p-4">
              {waitingOn.map((m) => (
                <li key={m.userId} className="flex items-center gap-2 text-sm">
                  <Avatar name={m.name} src={m.avatarUrl} size={24} tone={m.tone} />
                  <span>{m.name}</span>
                  {m.userId === viewer.id ? (
                    <Badge tone="action">That&rsquo;s you</Badge>
                  ) : null}
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
      </Stack>
    </Page>
  );
}
