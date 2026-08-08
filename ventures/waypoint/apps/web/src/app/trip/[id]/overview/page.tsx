/**
 * Trip dashboard (v1 ticket 13) — the landing every member sees after login.
 * The layout header above the tabs carries the roster and nothing else, so the
 * trip's own identity — name, state, dates — starts here (ticket 89).
 *
 * Re-laid out by v0.2 ticket 07. What the page *says* is unchanged from
 * ticket 13; the arrangement is not:
 *
 *   - A hero, split 65/35: where the planning is at, and who's doing it. The
 *     trip's name gets the page's largest type and the stage rides beside it
 *     as a badge (ticket 89), with the trail drawing the same answer
 *     spatially.
 *   - Unresolved is tinted by one question only — is this mine to do? The old
 *     version tinted money red and the other two amber, which encoded nothing.
 *   - Chasing moved onto the person it's aimed at (see TripRoster), so the
 *     Chase panel is gone: it and Unresolved were the same three checks read
 *     two different ways, a screen apart.
 *   - "Waiting on you" and "What's moved" were dropped on request. Nudges are
 *     still delivered by email from `sendNudge`, so nothing goes unheard.
 *   - Admin used to fold into a right-aligned "Trip settings" disclosure. That
 *     is gone: leaving, archiving and deleting are one triple-dot in the trip
 *     header (`components/trip-menu.tsx`), and the invite link is the roster's
 *     Share trip button — the fold held nothing else.
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

  // One query for the whole roster (ticket 96) — a per-row lookup would be an
  // N+1 on a panel every trip renders. The two invite reads join it: who has
  // been asked and hasn't answered, and who you could ask (ticket 146).
  const [friendStates, pendingInvitees, friends] = await Promise.all([
    friendStatesFor(
      viewer.id,
      members.map((m) => m.userId),
    ),
    listPendingInvitees(trip.id),
    // Only an admin can invite (rule 6), so a member's roster doesn't pay for
    // a friends read it has nothing to render.
    isAdmin ? listFriendsFor(viewer.id) : Promise.resolve([]),
  ]);
  const tripId = trip.id;

  /*
   * Overview reads from six tables to build the "unresolved" list, and none of
   * those reads depends on another — so they all go out together. Done
   * sequentially this page was the slowest tab in the app by a wide margin,
   * paying a full round trip per section.
   *
   * Votes and splits used to sit in a second wave, because they were scoped
   * with `inArray(...)` over ids the first wave returned. They are scoped by
   * joining back to `idea`/`expense` on `trip_id` instead, which is the same
   * set of rows without the dependency — so the whole page is one round trip
   * behind the access check rather than two.
   */
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
      // Only used while the dates are unset, but it is one indexed read and
      // fetching it unconditionally is cheaper than an extra serial round trip.
      listAvailability(tripId),
      listExpenses(tripId),
      // Counted, not just probed: the trail says "3 days sketched", so a
      // `.get()` for existence is no longer enough.
      listDays(tripId),
      listVotes(tripId),
      listSplits(tripId),
      // The route moved here when the Route tab retired (ticket 142). It is a
      // second pass over `day` — the places and their coordinates, which
      // `listDays` doesn't carry — plus the travel modes off `day_event`.
      listRouteDays(tripId),
      transportModesByDay(tripId),
    ]);

  /*
   * Everything the page shows about *where the trip is up to* is derived here,
   * in one pure call (ticket 109). It used to be ninety lines of the same
   * thing inline, which is where the "who still has to vote, minus me" filter
   * ended up being recomputed four separate times inside the JSX. The page
   * renders; it no longer decides. What leaving costs comes back in the same
   * call, so the dialog can say it before the click (ticket 65).
   */
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
      {/* Split 65/35: the trip is the hero, the roster only needs room for a
          name and a bell. `items-start` lets the roster grow downward with the
          group without stretching the left half to match. */}
      <div className="grid gap-[18px] lg:grid-cols-[minmax(0,65fr)_minmax(0,35fr)] lg:items-start">
        <section className="tape-panel rounded-md border border-rule-strong bg-sheet-2 p-5">
          {/* The name is the headline (ticket 89): it's the one thing that
              doesn't change shape as the trip moves, so the hero stops
              re-flowing every time the stage does. Renaming comes with it from
              the header above the tabs (ticket 37) — the name you want to fix
              is still the one you click. */}
          <div className="flex flex-wrap items-center gap-2">
            <TripNameInline tripId={tripId} name={trip.name} rename={renameTrip} />
            <Badge tone={stage.tone}>{stage.label}</Badge>
            {trip.archivedAt ? <Badge tone="neutral">Archived</Badge> : null}
            {countdown ? <Badge tone="marine">{countdown}</Badge> : null}
          </div>
          {/* The stage note went with the empty state it echoed: the badge
              beside the name and the trail below already say where the trip is
              up to, in fewer words and in two places. */}
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
              // Deciding the dates is the Dates tab's whole job — a second pair
              // of date inputs here would be a way to set them without ever
              // seeing whether the group is free.
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

          {/* The group's own labels (ticket 71), edited where they're read
              (ticket 86): they used to display here and be edited three
              scrolls down inside Trip settings, which is where you'd never
              look for them. Any member, like renaming. */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {tags.map((tag) => (
              <Badge key={tag} tone={tagTone(tagTones, tag)}>
                {tag}
              </Badge>
            ))}
            {/* A bordered button, not a ghost: on a hero of plain text a
                control that only draws itself on hover isn't findable, and its
                own padding was floating the label off the block's left edge.
                The box edge is what lines up with the name and the dates. */}
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

          {/* Archive and delete were a strip here (ticket 72), and leaving was
              a fold at the foot of the page. All three moved into the header's
              triple-dot — see `components/trip-menu.tsx`. */}
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

      {/* "This trip is just a name so far" and its Post the first idea button
          used to stand in for Unresolved on a brand-new trip. The hero already
          says the same thing twice over — the stage badge, the stage note and
          the trail all start at Ideas — so it was a third copy of it. */}
      <section className="mt-6">
          <h2 className="text-[15px] font-semibold">Unresolved</h2>

          <div className="mt-3 flex flex-col gap-2">
            {/*
              Yours first, and the only tinted rows. Colour here answers one
              question — is this mine to do? — in the same blue the trail uses
              for "you are here". Red is reserved for destructive controls.
            */}
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

            {/* Theirs: untinted, and named by face. Chase from the roster. */}
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

      {/* Below Unresolved on purpose: Overview answers "what's outstanding"
          first and draws the plan second. `TripRoute` renders nothing at all
          when no day has an overnight place yet. */}
      <TripRoute days={routeDays} transportModes={transportModes} />
    </Page>
  );
}

/**
 * Tags, their colours, and deleting one — all in the same rows (ticket 86).
 * The editing itself lives in `TagEditor`, which owns the rows; this is just
 * the form around it and the save.
 */
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

/**
 * One outstanding thing. `mine` is the only state that takes a tint, and it
 * takes the trail's blue: the tint answers "is this mine to do?" and nothing
 * else. Both variants name the tab in a neutral badge and end in the same
 * boxed control, because they do the same thing — open that tab.
 */
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
