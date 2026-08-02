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
  Field,
  Input,
  Page,
  PageHeader,
  Stack,
} from "@/components/ui";
import { ActionForm, ConfirmSubmit, SubmitButton } from "@/components/client-ui";
import { AvailabilityCalendar } from "@/components/availability-calendar";
import {
  clearMyAvailability,
  clearTripDates,
  saveAvailability,
  setTripDatesFromCalendar,
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
      <PageHeader
        title="Dates"
        subtitle="Mark the days you could go."
      />

      <Stack gap={6}>
        <Card>
          <CardHeader
            title={hasDates ? "The dates" : "No dates yet"}
            hint={hasDates ? "Everything else on the trip hangs off these." : undefined}
            actions={
              hasDates ? (
                <form action={clearTripDates.bind(null, tripId)}>
                  <ConfirmSubmit
                    variant="ghost"
                    message="Clear the trip's dates? Days and events stay where they are."
                  >
                    Clear dates
                  </ConfirmSubmit>
                </form>
              ) : undefined
            }
          />
          <div className="flex flex-col gap-4 p-4">
            {hasDates ? (
              <p className="text-sm">
                <span className="nums">
                  {formatDateRange(trip.startDate, trip.endDate)}
                </span>{" "}
                <span className="text-ink-faint">
                  ({nightsBetween(trip.startDate!, trip.endDate!)} nights)
                </span>
              </p>
            ) : null}

            <ActionForm action={setTripDatesFromCalendar}>
              <input type="hidden" name="tripId" value={tripId} />
              <div className="flex flex-wrap items-end gap-2">
                <Field label="Start" className="w-40">
                  <Input
                    type="date"
                    name="startDate"
                    defaultValue={trip.startDate ?? suggestion?.start ?? ""}
                  />
                </Field>
                <Field label="End" className="w-40">
                  <Input
                    type="date"
                    name="endDate"
                    defaultValue={trip.endDate ?? suggestion?.end ?? ""}
                  />
                </Field>
                <SubmitButton pendingLabel="Setting…">
                  {hasDates ? "Change dates" : "Set the dates"}
                </SubmitButton>
              </div>
            </ActionForm>

            {suggestion ? (
              <p className="text-xs text-ink-faint">
                Best overlap so far:{" "}
                <span className="nums text-ink-soft">
                  {suggestion.start === suggestion.end
                    ? formatDate(suggestion.start)
                    : `${formatDate(suggestion.start)} – ${formatDate(suggestion.end)}`}
                </span>{" "}
                — {suggestion.free} of {members.length} free
                {hasDates ? "" : ", pre-filled above"}.
              </p>
            ) : null}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Who can do when"
            hint="Your own days, or the whole group's overlap."
            actions={
              mine.length > 0 ? (
                <form action={clearMyAvailability.bind(null, tripId)}>
                  <ConfirmSubmit
                    variant="ghost"
                    message="Clear all the days you've marked? Nobody else's are touched."
                  >
                    Start again
                  </ConfirmSubmit>
                </form>
              ) : undefined
            }
          />
          <div className="p-4">
            <AvailabilityCalendar
              firstMonth={firstMonth}
              monthCount={MONTHS_SHOWN}
              mine={mine}
              tallies={tallies}
              memberCount={members.length}
              tripStart={trip.startDate}
              tripEnd={trip.endDate}
              save={saveAvailability.bind(null, tripId)}
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
