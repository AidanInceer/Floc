/**
 * Trip dashboard (ticket 13) — the landing every member sees. The trip's own
 * identity starts here since the layout header only carries the roster (ticket
 * 89). Hero split 65/35 (where planning is at | who's doing it); Unresolved is
 * tinted by one question only — is this mine to do? (ticket 07).
 */
import Link from "next/link";

import { requireTripAccess } from "@/server/access";
import { listIdeaIds, listVotes } from "@/server/ideas";
import { listDays, listRouteDays, transportModesByDay } from "@/server/itinerary";
import { listAvailability, listPendingInvitees } from "@/server/membership";
import { listExpenses, listSplits } from "@/server/money";
import { absoluteUrl } from "@/server/email";
import { formatMoney } from "@/lib/money";
import { tripStateFor } from "@/lib/trip-state";
import { formatDateRange } from "@/lib/dates";
import { Avatar, Badge, Page, Stack, cx } from "@/components/ui";
import { Sheet, SubmitButton } from "@/components/client-ui";
import { TripNameInline } from "@/components/trip-name-inline";
import { TripRoster } from "@/components/trip-roster";
import { friendStatesFor, listFriendsFor } from "@/server/friends";
import { TripRoute } from "@/components/trip-route";
import { TripForecast } from "@/components/trip-forecast";
import { getTripForecast } from "@/server/weather";
import { TripTrail } from "@/components/trip-trail";
import { TagEditor } from "@/components/tag-editor";
import { readTagTones, readTags, tagTone, type TagTone } from "@/lib/tags";
import { renameTrip, setTripTags } from "./actions";

export default async function OverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const access = await requireTripAccess(id, `/trip/${id}/overview`);
  const { trip, members, isAdmin, viewer } = access;

  // One roster query, not a per-row N+1 (ticket 96). Friends read is admin-only
  // — a member can't invite (rule 6), so it has nothing to render (ticket 146).
  const [friendStates, pendingInvitees, friends] = await Promise.all([
    friendStatesFor(
      viewer.id,
      members.map((m) => m.userId),
    ),
    listPendingInvitees(trip.id),
    isAdmin ? listFriendsFor(viewer.id) : Promise.resolve([]),
  ]);
  const tripId = trip.id;

  // All independent, so one round trip behind the access check. Votes/splits
  // scope by joining on `trip_id` rather than ids a first wave returns, which
  // is what keeps them out of a second wave.
  const [
    ideaIds,
    availabilityRows,
    expenseRows,
    dayRows,
    votes,
    splitRows,
    routeDays,
    transportModes,
    forecast,
  ] = await Promise.all([
      listIdeaIds(tripId),
      // Unconditional: one indexed read is cheaper than a serial round trip when
      // the dates are unset.
      listAvailability(tripId),
      listExpenses(tripId),
      listDays(tripId),
      listVotes(tripId),
      listSplits(tripId),
      // Route moved here when its tab retired (ticket 142): places + coordinates
      // `listDays` doesn't carry, plus travel modes off `day_event`.
      listRouteDays(tripId),
      transportModesByDay(tripId),
      getTripForecast(tripId), // null → forecast register renders nothing (ticket 148)
    ]);

  // All "where the trip is up to" is derived in one pure call (ticket 109); the
  // page renders, it no longer decides. Leaving cost rides along for the dialog
  // (ticket 65).
  const state = tripStateFor({
    trip,
    members,
    viewerId: viewer.id,
    viewerIsAdmin: isAdmin,
    ideaIds,
    votes,
    availabilityUserIds: availabilityRows.map((r) => r.userId),
    days: dayRows,
    expenses: expenseRows,
    splits: splitRows,
  });

  const {
    datesUnset,
    countdown,
    stage,
    stations,
    unresolved,
  } = state;
  const viewerHasVotedAll = state.viewer.hasVotedAll;
  const viewerHasAvailability = state.viewer.hasAvailability;
  const viewerPositions = state.viewer.positions;

  const inviteUrl = absoluteUrl(`/invite/${trip.inviteToken}`);
  const tags = readTags(trip.tags);
  const tagTones = readTagTones(trip.tagTones);

  return (
    <Page wide flush>
      {/* `items-start` lets the roster grow down without stretching the hero. */}
      <div className="grid gap-[18px] lg:grid-cols-[minmax(0,65fr)_minmax(0,35fr)] lg:items-start">
        <section className="tape-panel rounded-md border border-rule-strong bg-sheet-2 p-5">
          {/* The name is the headline (ticket 89): the one thing that keeps its
              shape as the trip moves, so the hero stops re-flowing. */}
          <div className="flex flex-wrap items-center gap-2">
            <TripNameInline tripId={tripId} name={trip.name} rename={renameTrip} />
            <Badge tone={stage.tone}>{stage.label}</Badge>
            {trip.archivedAt ? <Badge tone="neutral">Archived</Badge> : null}
            {countdown ? <Badge tone="marine">{countdown}</Badge> : null}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
            {trip.startDate || trip.endDate ? (
              <span>
                {formatDateRange(trip.startDate, trip.endDate)}{" "}
                <Link
                  href={`/trip/${tripId}/dates`}
                  className="text-pen underline underline-offset-2 transition-colors hover:bg-highlight-soft hover:text-pen-deep"
                >
                  change
                </Link>
              </span>
            ) : (
              // No date inputs here — deciding dates is the Dates tab's job,
              // where you see the group's availability first.
              <span>
                Dates not set{" "}
                <Link
                  href={`/trip/${tripId}/dates`}
                  className="text-pen underline underline-offset-2 transition-colors hover:bg-highlight-soft hover:text-pen-deep"
                >
                  pick them
                </Link>
              </span>
            )}
          </div>

          {/* Group labels, edited where they're read (ticket 71, 86). Any member. */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {tags.map((tag) => (
              <Badge key={tag} tone={tagTone(tagTones, tag)}>
                {tag}
              </Badge>
            ))}
            {/* Bordered, not ghost: a hover-only control isn't findable on a
                hero of plain text, and the box edge aligns with name and dates. */}
            <Sheet
              trigger={tags.length > 0 ? "Edit tags" : "Add tags"}
              title="Tags"
              triggerVariant="secondary"
              triggerClassName="!px-2.5 !py-1"
            >
              <TripTagsForm tripId={tripId} tags={tags} tagTones={tagTones} />
            </Sheet>
          </div>

          <TripTrail stations={stations} />
        </section>

        <TripRoster
          tripId={tripId}
          viewerId={viewer.id}
          members={members}
          isAdmin={isAdmin}
          inviteUrl={isAdmin ? inviteUrl : undefined}
          friendStates={friendStates}
          pendingInvitees={pendingInvitees}
          friends={friends}
        />
      </div>

      <section className="mt-6">
          <h2 className="text-[15px] font-semibold">Unresolved</h2>

          <div className="mt-3 flex flex-col gap-2">
            {/* Yours first, and the only tinted rows — the trail's blue answers
                "is this mine to do?". Red is reserved for destructive controls. */}
            {!viewerHasVotedAll ? (
              <UnresolvedRow
                mine
                tab="Ideas"
                href={`/trip/${tripId}/ideas`}
                headline="Your turn — you haven't voted on every idea"
                detail="Voting is optional, but an unvoted idea can't be ruled in or out."
              />
            ) : null}
            {datesUnset && !viewerHasAvailability ? (
              <UnresolvedRow
                mine
                tab="Dates"
                href={`/trip/${tripId}/dates`}
                headline="Your turn — you haven't shared your availability"
                detail="Nothing can be locked in until most of you have."
              />
            ) : null}
            {viewerPositions.map((p) => (
              <UnresolvedRow
                key={p.currency}
                mine
                tab="Money"
                href={`/trip/${tripId}/money`}
                headline={
                  p.amount < 0
                    ? `Your turn — you owe ${formatMoney(-p.amount, p.currency)}`
                    : `You're owed ${formatMoney(p.amount, p.currency)}`
                }
                detail={
                  p.amount < 0
                    ? "Settling is done between you — the app only keeps the ledger."
                    : "Nothing for you to do but chase, from the roster above."
                }
              />
            ))}

            {/* Theirs: untinted, named by face. */}
            {unresolved.votingOthers.length > 0 ? (
              <UnresolvedRow
                tab="Ideas"
                href={`/trip/${tripId}/ideas`}
                headline={`Waiting on ${peopleCount(unresolved.votingOthers.length)} to vote on every idea`}
                people={unresolved.votingOthers}
              />
            ) : null}
            {unresolved.availabilityOthers.length > 0 ? (
              <UnresolvedRow
                tab="Dates"
                href={`/trip/${tripId}/dates`}
                headline={`Waiting on ${peopleCount(unresolved.availabilityOthers.length)} to share availability`}
                people={unresolved.availabilityOthers}
              />
            ) : null}
            {unresolved.moneyOthers.length > 0 ? (
              <UnresolvedRow
                tab="Money"
                href={`/trip/${tripId}/money`}
                headline={`Waiting on ${peopleCount(unresolved.moneyOthers.length)} to settle up`}
                people={members.filter((m) => unresolved.moneyOthers.includes(m.userId))}
              />
            ) : null}

            {viewerHasVotedAll &&
            viewerHasAvailability &&
            viewerPositions.length === 0 &&
            unresolved.votingOthers.length === 0 &&
            unresolved.availabilityOthers.length === 0 &&
            unresolved.moneyOthers.length === 0 ? (
              <p className="text-sm text-ink-soft">
                Nothing outstanding right now — everyone&rsquo;s caught up.
              </p>
            ) : null}
          </div>
        </section>

      {/* Plan below Unresolved: outstanding first, plan second. Renders nothing
          until a day has an overnight place. */}
      <TripRoute days={routeDays} transportModes={transportModes} />

      {/* Last on the page (ticket 148): the map says where, the register what
          it'll be like there. */}
      <TripForecast
        forecast={forecast}
        tripStart={trip.startDate}
        tripEnd={trip.endDate}
      />
    </Page>
  );
}

// The form around `TagEditor` (which owns the rows) and its save (ticket 86).
function TripTagsForm({
  tripId,
  tags,
  tagTones,
}: {
  tripId: number;
  tags: string[];
  tagTones: Record<string, TagTone>;
}) {
  return (
    <form action={setTripTags}>
      <input type="hidden" name="tripId" value={tripId} />
      <Stack gap={3}>
        <TagEditor tags={tags} tones={tagTones} />
        <p className="text-xs text-ink-faint">
          Tags show on the trip card, and My trips can be filtered by them.
        </p>
        <div>
          <SubmitButton variant="secondary" pendingLabel="Saving…">
            Save tags
          </SubmitButton>
        </div>
      </Stack>
    </form>
  );
}

function peopleCount(n: number) {
  return n === 1 ? "1 person" : `${n} people`;
}

// One outstanding thing. `mine` is the only tinted state (trail's blue).
function UnresolvedRow({
  mine,
  tab,
  href,
  headline,
  detail,
  people,
}: {
  mine?: boolean;
  tab: string;
  href: string;
  headline: string;
  detail?: string;
  people?: { userId: string; name: string; avatarUrl: string | null; tone?: string }[];
}) {
  return (
    <div
      className={cx(
        "flex flex-wrap items-center gap-2.5 rounded-sm border border-rule border-l-[3px] px-3 py-2.5",
        mine ? "border-l-pen bg-pen-soft" : "border-l-rule-strong bg-sheet",
      )}
    >
      <div className="flex-1 basis-60 text-sm">
        <Badge>{tab}</Badge>{" "}
        {mine ? <strong>{headline}</strong> : headline}
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[12.5px] text-ink-soft">
          {people?.length ? (
            <span className="flex">
              {people.map((p, i) => (
                <span key={p.userId} className={cx(i > 0 && "-ml-1.5")}>
                  <Avatar name={p.name} src={p.avatarUrl} size={20} tone={p.tone} />
                </span>
              ))}
            </span>
          ) : null}
          {people?.length ? formatNames(people.map((p) => p.name)) : detail}
        </div>
      </div>
      <Link
        href={href}
        className="inline-flex items-center gap-1.5 rounded-sm border border-rule-strong bg-sheet-2 px-2.5 py-1 text-[12.5px] font-semibold whitespace-nowrap text-ink-soft hover:border-pen hover:text-pen"
      >
        Open {tab} <span aria-hidden="true" className="text-pen">&raquo;</span>
      </Link>
    </div>
  );
}

function formatNames(names: string[]) {
  if (names.length <= 2) return names.join(" and ");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}
