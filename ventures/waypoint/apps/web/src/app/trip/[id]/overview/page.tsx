/**
 * Trip Overview (ticket 13; redesigned 195) — the landing every member sees.
 *
 * Two parts: the day track across the top (what the trip *is*), then tiles
 * sized by how much they matter (what the trip *needs*). Only the viewer's own
 * outstanding work is blue — everything else is a domain pastel, so "mine to
 * do" never has to compete with "someone else's" for the same colour.
 */
import Link from "next/link";
import type { ReactNode } from "react";

import { requireTripAccess } from "@/server/access";
import { listIdeaIds, listVotes } from "@/server/ideas";
import { listDays, listRouteDays, transportModesByDay } from "@/server/itinerary";
import { listAvailability, listPendingInvitees } from "@/server/membership";
import { listExpenses, listSplits } from "@/server/money";
import { absoluteUrl } from "@/server/email";
import { formatMoney } from "@/lib/money";
import type { Currency } from "@/lib/currency";
import { tripStateFor } from "@/lib/trip-state";
import { formatDateRange } from "@/lib/dates";
import { Avatar, Badge, ButtonLink, Stack, cx } from "@/components/ui";
import { Sheet, SubmitButton } from "@/components/client-ui";
import { TripNameInline } from "@/components/trip-name-inline";
import { TripRoster } from "@/components/trip-roster";
import { friendStatesFor, listFriendsFor } from "@/server/friends";
import { TripRoute } from "@/components/trip-route";
import { TripDayTrack } from "@/components/trip-day-track";
import { getTripForecast } from "@/server/weather";
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
    getTripForecast(tripId), // null → the track carries no weather (ticket 148)
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

  const { datesUnset, countdown, stage, unresolved } = state;
  const viewerHasVotedAll = state.viewer.hasVotedAll;
  const viewerHasAvailability = state.viewer.hasAvailability;
  const viewerPositions = state.viewer.positions;

  const unvoted = ideaIds.length - votes.filter((v) => v.userId === viewer.id).length;
  const spend = spendByCurrency(expenseRows);
  const inviteUrl = absoluteUrl(`/invite/${trip.inviteToken}`);
  const tags = readTags(trip.tags);
  const tagTones = readTagTones(trip.tagTones);

  const yours: { key: string; href: string; label: string; amount?: string }[] = [];
  if (!viewerHasVotedAll) {
    yours.push({
      key: "ideas",
      href: `/trip/${tripId}/ideas`,
      label: unvoted === 1 ? "Vote on the last idea" : `Vote on ${unvoted} ideas`,
    });
  }
  if (datesUnset && !viewerHasAvailability) {
    yours.push({
      key: "dates",
      href: `/trip/${tripId}/dates`,
      label: "Say which days you could go",
    });
  }
  for (const p of viewerPositions) {
    yours.push({
      key: `money-${p.currency}`,
      href: `/trip/${tripId}/money`,
      label: p.amount < 0 ? "Settle what you owe" : "You're owed",
      amount: formatMoney(Math.abs(p.amount), p.currency),
    });
  }

  const waiting = [
    ...unresolved.votingOthers.map((m) => ({
      userId: m.userId,
      name: m.name,
      avatarUrl: m.avatarUrl,
      what: "their vote",
      href: `/trip/${tripId}/ideas`,
    })),
    ...unresolved.availabilityOthers.map((m) => ({
      userId: m.userId,
      name: m.name,
      avatarUrl: m.avatarUrl,
      what: "their dates",
      href: `/trip/${tripId}/dates`,
    })),
    ...members
      .filter((m) => unresolved.moneyOthers.includes(m.userId))
      .map((m) => ({
        userId: m.userId,
        name: m.name,
        avatarUrl: m.avatarUrl,
        what: "settling up",
        href: `/trip/${tripId}/money`,
      })),
  ];

  return (
    <div className="mx-auto w-full max-w-[84rem] px-4 pb-20 pt-6 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          {/* The name is the headline (ticket 89): the one thing that keeps its
              shape as the trip moves, so the hero stops re-flowing. */}
          <div className="flex flex-wrap items-center gap-2">
            <TripNameInline tripId={tripId} name={trip.name} rename={renameTrip} />
            <Badge tone={stage.tone}>{stage.label}</Badge>
            {trip.archivedAt ? <Badge tone="neutral">Archived</Badge> : null}
            {countdown ? <Badge tone="marine">{countdown}</Badge> : null}
          </div>
          <p className="nums mt-3 text-sm text-ink-soft">
            {formatDateRange(trip.startDate, trip.endDate)}{" "}
            {/* No date inputs here — deciding dates is the Dates tab's job,
                where you see the group's availability first. */}
            <Link
              href={`/trip/${tripId}/dates`}
              className="text-pen underline underline-offset-2 hover:text-pen-deep"
            >
              {datesUnset ? "pick them" : "change"}
            </Link>
          </p>
          {/* Group labels, edited where they're read (ticket 71, 86). Any member. */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {tags.map((tag) => (
              <Badge key={tag} tone={tagTone(tagTones, tag)}>
                {tag}
              </Badge>
            ))}
            <Sheet
              trigger={tags.length > 0 ? "Edit tags" : "Add tags"}
              title="Tags"
              triggerVariant="secondary"
            >
              <TripTagsForm tripId={tripId} tags={tags} tagTones={tagTones} />
            </Sheet>
          </div>
        </div>
      </header>

      <TripDayTrack
        tripId={tripId}
        days={routeDays}
        transportModes={transportModes}
        forecast={forecast}
      />

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Blue, and the only blue on the page — this is the viewer's own list. */}
        <Tile span={2} skin="bg-pen-soft text-pen-deep" >
          <span className="typed opacity-70">Needs you</span>
          <h2 className="mt-1.5 text-xl">
            {yours.length === 0
              ? "Nothing on you"
              : yours.length === 1
                ? "One thing, then you're clear"
                : `${yours.length} things, then you're clear`}
          </h2>
          {yours.length === 0 ? (
            <p className="mt-2 text-sm opacity-80">
              You&rsquo;ve voted, said when you can go, and you&rsquo;re square
              on money.
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-2">
              {yours.map((y) => (
                <li key={y.key}>
                  <Link
                    href={y.href}
                    className="flex items-center gap-3 rounded-md bg-sheet/70 px-4 py-3 text-sm font-semibold transition-colors hover:bg-sheet"
                  >
                    <span className="min-w-0 flex-1 truncate">{y.label}</span>
                    {y.amount ? <span className="nums">{y.amount}</span> : null}
                    <span aria-hidden="true">&rarr;</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Tile>

        <TileLink href={`/trip/${tripId}/money`} skin="bg-mint text-mint-ink">
          <span className="typed opacity-60">Spent so far</span>
          <p className="mt-1.5 font-display text-4xl font-semibold tracking-tight">
            {spend ? formatMoney(spend.total, spend.currency) : "—"}
          </p>
          <p className="mt-2 text-sm opacity-80">
            {expenseRows.length === 0
              ? "Nothing logged yet"
              : `${expenseRows.length} ${expenseRows.length === 1 ? "expense" : "expenses"}${
                  spend && spend.otherCurrencies > 0
                    ? `, plus ${spend.otherCurrencies} in other currencies`
                    : ""
                }`}
          </p>
        </TileLink>

        <TileLink href={`/trip/${tripId}/ideas`} skin="bg-butter text-butter-ink">
          <span className="typed opacity-60">Ideas</span>
          <p className="mt-1.5 font-display text-4xl font-semibold tracking-tight">
            {ideaIds.length}
          </p>
          <p className="mt-2 text-sm opacity-80">
            {ideaIds.length === 0
              ? "The first one gets a trip moving"
              : unvoted > 0
                ? `${unvoted} you haven't voted on`
                : "You've voted on all of them"}
          </p>
        </TileLink>

        {/* Present, but visibly not the viewer's problem: pastel, not blue. */}
        <Tile span={2} skin="bg-sheet">
          <span className="typed">Waiting on others</span>
          {waiting.length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">
              Nobody owes the group anything right now.
            </p>
          ) : (
            <ul className="mt-3 flex flex-wrap gap-2">
              {waiting.map((w) => (
                <li key={`${w.userId}-${w.what}`}>
                  <Link
                    href={w.href}
                    className="flex items-center gap-2 rounded-full bg-sheet-2 py-1 pl-1 pr-4 text-sm transition-colors hover:bg-sheet-3"
                  >
                    <Avatar name={w.name} src={w.avatarUrl} size={26} />
                    <span className="truncate">
                      {w.name} &mdash; {w.what}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Tile>

        {/* The biggest hole in the plan, with the control that fills it. */}
        <Tile span={2} skin="bg-sheet">
          <Gap
            tripId={tripId}
            datesUnset={datesUnset}
            hasIdeas={ideaIds.length > 0}
            unplacedDays={routeDays.filter((d) => d.overnightPlaceId === null).length}
            hasDays={routeDays.length > 0}
          />
        </Tile>
      </div>

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

      {/* Renders nothing until a day has an overnight place. */}
      <TripRoute days={routeDays} transportModes={transportModes} />
    </div>
  );
}

function Tile({
  span,
  skin,
  children,
}: {
  span?: 2;
  skin: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cx("rounded-lg p-6", skin, span === 2 && "sm:col-span-2")}
    >
      {children}
    </section>
  );
}

function TileLink({
  href,
  skin,
  children,
}: {
  href: string;
  skin: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={cx("lift block rounded-lg p-6", skin)}>
      {children}
    </Link>
  );
}

/**
 * One hole, never a list of them — a page that names five gaps names none. The
 * order is the order a trip actually gets stuck in.
 */
function Gap({
  tripId,
  datesUnset,
  hasIdeas,
  hasDays,
  unplacedDays,
}: {
  tripId: number;
  datesUnset: boolean;
  hasIdeas: boolean;
  hasDays: boolean;
  unplacedDays: number;
}) {
  const gap = !hasIdeas
    ? {
        title: "Nobody has suggested anywhere yet",
        detail: "An idea is the thing the group can argue with.",
        href: `/trip/${tripId}/ideas`,
        cta: "Post an idea",
      }
    : datesUnset
      ? {
          title: "The dates aren't settled",
          detail: "Everyone paints the days they could go, and a window falls out.",
          href: `/trip/${tripId}/dates`,
          cta: "Open Dates",
        }
      : !hasDays
        ? {
            title: "The week is still blank",
            detail: "Sketch the days and the route draws itself.",
            href: `/trip/${tripId}/days`,
            cta: "Open Days",
          }
        : unplacedDays > 0
          ? {
              title:
                unplacedDays === 1
                  ? "One night has nowhere to sleep"
                  : `${unplacedDays} nights have nowhere to sleep`,
              detail: "A day without an overnight place is a gap in the track above.",
              href: `/trip/${tripId}/days`,
              cta: "Fill them in",
            }
          : {
              title: "The plan holds together",
              detail: "Every day has somewhere to sleep and the dates are set.",
              href: `/trip/${tripId}/days`,
              cta: "Open Days",
            };

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="min-w-[14rem] flex-1">
        <span className="typed">The biggest gap</span>
        <h2 className="mt-1.5 text-lg">{gap.title}</h2>
        <p className="mt-1.5 text-sm text-ink-soft">{gap.detail}</p>
      </div>
      <ButtonLink href={gap.href} variant="primary">
        {gap.cta}
      </ButtonLink>
    </div>
  );
}

/**
 * A headline number needs one currency. The one with the most expenses wins and
 * the rest are counted, rather than summing across currencies (rule 1's spirit:
 * money is never fudged).
 */
function spendByCurrency(
  expenses: { currency: Currency; amountMinor: number }[],
): { currency: Currency; total: number; otherCurrencies: number } | null {
  if (expenses.length === 0) return null;
  const books = new Map<Currency, { total: number; count: number }>();
  for (const e of expenses) {
    const book = books.get(e.currency) ?? { total: 0, count: 0 };
    book.total += e.amountMinor;
    book.count += 1;
    books.set(e.currency, book);
  }
  const [currency, book] = [...books.entries()].reduce((best, entry) =>
    entry[1].count > best[1].count ? entry : best,
  );
  return { currency, total: book.total, otherCurrencies: books.size - 1 };
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
