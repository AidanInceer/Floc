/**
 * Trip Overview (ticket 13; redesigned 195, re-ranked 207/208) — the landing
 * every member sees.
 *
 * TWO COLUMNS (wireframe A, ticket 209). The split is trip vs group:
 *
 *   - The wide left column is the TRIP: where you're going.
 *   - The narrow right rail is the GROUP: who's going, what's been spent, how
 *     many ideas, who the trip is waiting on. Every one of these grows
 *     downward, which is why the rail is where they belong — the roster used
 *     to be a full-width panel holding one row of avatars and a lot of air.
 *   - The week runs full width under both, because a day track wants length.
 *
 * On a narrow screen the rail simply falls in under the left column; nothing
 * is repositioned by media query beyond the columns collapsing.
 *
 * Removed rather than reordered: the "biggest gap" panel. It narrated the
 * state of the plan back at you ("The plan holds together") without ever being
 * the thing you came for — and every gap it could name is already named by the
 * header ("Dates not set · pick them"), by Needs you, or by Waiting on others.
 *
 * Weather is off this page too — it lives on Dates, where it decides something.
 *
 * Also GONE: the "Needs you" panel (ticket 209). A to-do list narrated back at
 * you ("One thing, then you're clear") is not what a member opens a trip page
 * for, and every item on it was a link to a tab that is already in the tab bar
 * — voting to Ideas, availability to Dates, a balance to Money. The one thing
 * it said that nothing else does — who the group is still waiting on — is its
 * own panel in the rail.
 *
 * Every panel carries ONE heading, no eyebrow above it (`SectionHead`).
 */
import Link from "next/link";
import type { ReactNode } from "react";

import { requireTripAccess } from "@/server/access";
import { listIdeaIds, listVotes } from "@/server/ideas";
import {
  listDays,
  listRouteDays,
  transportModesByDay,
} from "@/server/itinerary";
import { listAvailability, listPendingInvitees } from "@/server/membership";
import { listExpenses, listSplits } from "@/server/money";
import { absoluteUrl } from "@/server/email";
import { formatMoney } from "@/lib/money";
import type { Currency } from "@/lib/currency";
import { tripStateFor } from "@/lib/trip-state";
import { formatDateRange } from "@/lib/dates";
import { Avatar, Badge, Stack, cx } from "@/components/ui";
import { Sheet, SubmitButton } from "@/components/client-ui";
import { TripNameInline } from "@/components/trip-name-inline";
import { TripRoster } from "@/components/trip-roster";
import { friendStatesFor, listFriendsFor } from "@/server/friends";
import { TripRoute } from "@/components/trip-route";
import { TripDayTrack } from "@/components/trip-day-track";
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
  const unvoted =
    ideaIds.length - votes.filter((v) => v.userId === viewer.id).length;
  const spend = spendByCurrency(expenseRows);
  const inviteUrl = absoluteUrl(`/invite/${trip.inviteToken}`);
  const tags = readTags(trip.tags);
  const tagTones = readTagTones(trip.tagTones);

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
            <TripNameInline
              tripId={tripId}
              name={trip.name}
              rename={renameTrip}
            />
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

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* The trip. */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          {/* Renders nothing until a day has an overnight place — an undated
              trip has no route to draw, and the header already says so. */}
          <TripRoute days={routeDays} transportModes={transportModes} />
        </div>

        {/* The group. Narrow on purpose: every panel in here is a list or a
            single figure, and both read better tall than wide. */}
        <div className="flex flex-col gap-4">
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
          {/* Present, but visibly not the viewer's problem: white, not blue. */}
          <Tile skin={PANEL}>
            <SectionHead title="Still outstanding" />
            {waiting.length === 0 ? (
              <p className="mt-2 text-sm text-ink-soft">
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
          <TileLink href={`/trip/${tripId}/money`} skin="bg-mint text-mint-ink">
            <span className="font-display text-lg">Spending</span>
            <p className="mt-1 font-display text-3xl font-semibold tracking-tight">
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
          <TileLink
            href={`/trip/${tripId}/ideas`}
            skin="bg-butter text-butter-ink"
          >
            <span className="font-display text-lg">Ideas</span>
            <p className="mt-1 font-display text-3xl font-semibold tracking-tight">
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
        </div>
      </div>

      {/* The week, last: it is the detail behind everything above, and the
          Days tab is where it is actually edited. */}
      <TripDayTrack
        tripId={tripId}
        days={routeDays}
        transportModes={transportModes}
      />
    </div>
  );
}

/**
 * Rank 3: a white panel with a hairline. The hairline is what makes a white
 * surface a panel at all — white on the near-white canvas has no edge of its
 * own, which is why the old bare `bg-sheet` sections read as loose text.
 */
const PANEL = "bg-sheet ring-1 ring-rule";

function Tile({
  skin,
  tight,
  children,
}: {
  skin: string;
  /** Rail padding — for a panel in the narrow right column. */
  tight?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={cx("rounded-lg", tight ? "p-5" : "p-6", skin)}>
      {children}
    </section>
  );
}

/**
 * ONE heading per panel (ticket 209). It used to be a typed eyebrow over a
 * display title — "The group" above "Who's going" — which is the same fact
 * printed twice. A panel gets one name; the drawing under it says the rest.
 */
function SectionHead({ title }: { title: string }) {
  return <h2 className="font-display text-lg">{title}</h2>;
}

// A rail figure — one number and a line about it. Tighter than a `Tile`:
// these sit in the narrow column and shouldn't out-weigh the roster above them.
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
    <Link href={href} className={cx("lift block rounded-lg p-5", skin)}>
      {children}
    </Link>
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
