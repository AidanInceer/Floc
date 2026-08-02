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
 *   - Admin folds into a right-aligned "Trip settings" disclosure; it was a
 *     permanent third of the width for four controls used once a trip.
 */
import Link from "next/link";
import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import {
  availability,
  day,
  expense,
  expenseSplit,
  idea,
  ideaVote,
} from "@/db/schema";
import { requireTripAccess } from "@/server/access";
import { absoluteUrl } from "@/server/email";
import { formatMoney } from "@/lib/money";
import { tripStateFor } from "@/lib/trip-state";
import { formatDateRange } from "@/lib/dates";
import {
  Avatar,
  Badge,
  ButtonLink,
  EmptyState,
  Page,
  Stack,
  cx,
} from "@/components/ui";
import {
  ConfirmSubmit,
  CopyLink,
  Sheet,
  SubmitButton,
} from "@/components/client-ui";
import { TripNameInline } from "@/components/trip-name-inline";
import { TripRoster } from "@/components/trip-roster";
import { friendStatesFor } from "@/server/friends";
import { TripTrail } from "@/components/trip-trail";
import { TagEditor } from "@/components/tag-editor";
import { readTagTones, readTags, tagTone, type TagTone } from "@/lib/tags";
import {
  archiveTripFromOverview,
  deleteTripFromOverview,
  leaveTrip,
  promoteMember,
  renameTrip,
  setTripTags,
} from "./actions";

export default async function OverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const access = await requireTripAccess(id, `/trip/${id}/overview`);
  const { trip, members, isAdmin, viewer } = access;

  // One query for the whole roster (ticket 96) — a per-row lookup would be an
  // N+1 on a panel every trip renders.
  const friendStates = await friendStatesFor(
    viewer.id,
    members.map((m) => m.userId),
  );
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
  const [ideas, availabilityRows, expenseRows, dayRows, votes, splitRows] =
    await Promise.all([
    db
      .select({ id: idea.id })
      .from(idea)
      .where(and(eq(idea.tripId, tripId), isNull(idea.deletedAt)))
      .all(),
    // Only used while the dates are unset, but it is one indexed read and
    // fetching it unconditionally is cheaper than an extra serial round trip.
    db
      .select({ userId: availability.userId })
      .from(availability)
      .where(and(eq(availability.tripId, tripId), isNull(availability.deletedAt)))
      .all(),
    db
      .select({
        id: expense.id,
        paidBy: expense.paidBy,
        currency: expense.currency,
        amountMinor: expense.amountMinor,
      })
      .from(expense)
      .where(and(eq(expense.tripId, tripId), isNull(expense.deletedAt)))
      .all(),
    // Counted, not just probed: the trail says "3 days sketched", so a
    // `.get()` for existence is no longer enough.
    db
      .select({ id: day.id, overnightPlaceId: day.overnightPlaceId })
      .from(day)
      .where(and(eq(day.tripId, tripId), isNull(day.deletedAt)))
      .all(),
    // Scoped through `idea` rather than by a list of idea ids — an unscoped
    // read would pull every vote row in the database and lean on a JS filter
    // to hide them.
    db
      .select({ ideaId: ideaVote.ideaId, userId: ideaVote.userId })
      .from(ideaVote)
      .innerJoin(idea, eq(idea.id, ideaVote.ideaId))
      .where(
        and(
          eq(idea.tripId, tripId),
          isNull(idea.deletedAt),
          isNull(ideaVote.deletedAt),
        ),
      )
      .all(),
    // Scoped through `expense`, for the same reason.
    db
      .select({
        expenseId: expenseSplit.expenseId,
        userId: expenseSplit.userId,
        owedAmountMinor: expenseSplit.owedAmountMinor,
        settledAt: expenseSplit.settledAt,
      })
      .from(expenseSplit)
      .innerJoin(expense, eq(expense.id, expenseSplit.expenseId))
      .where(
        and(
          eq(expense.tripId, tripId),
          isNull(expense.deletedAt),
          isNull(expenseSplit.deletedAt),
        ),
      )
      .all(),
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
    ideaIds: ideas.map((i) => i.id),
    votes,
    availabilityUserIds: availabilityRows.map((r) => r.userId),
    days: dayRows,
    expenses: expenseRows,
    splits: splitRows,
  });

  const {
    isBrandNew,
    datesUnset,
    countdown,
    stage,
    stageNote,
    stations,
    unresolved,
  } = state;
  const viewerHasVotedAll = state.viewer.hasVotedAll;
  const viewerHasAvailability = state.viewer.hasAvailability;
  const viewerPositions = state.viewer.positions;
  const leaveWarning = state.leave.warning;

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
          <p className="mt-1.5 text-sm text-ink-soft">{stageNote}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
            {trip.startDate || trip.endDate ? (
              <span>
                {formatDateRange(trip.startDate, trip.endDate)}{" "}
                <Link
                  href={`/trip/${tripId}/dates`}
                  className="text-pen underline underline-offset-2"
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
                  className="text-pen underline underline-offset-2"
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
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {tags.map((tag) => (
              <Badge key={tag} tone={tagTone(tagTones, tag)}>
                {tag}
              </Badge>
            ))}
            <Sheet
              trigger={tags.length > 0 ? "Edit tags" : "Add tags"}
              title="Tags"
              triggerVariant="ghost"
            >
              <TripTagsForm tripId={tripId} tags={tags} tagTones={tagTones} />
            </Sheet>
          </div>

          <TripTrail stations={stations} />

          {/*
            Delete and archive live here, not three clicks into the Trip
            settings disclosure (ticket 72). Renaming already came out to the
            header in ticket 37; this is the other half of the same complaint —
            the two things you do *to a trip* were the only ones still filed
            under a fold, and delete in particular read as missing.

            Admin-gated (rule 6) and confirm-first, the same pattern as the
            roster's boot (ticket 38). Deliberately at the foot of the hero and
            in ghost/danger weight: reachable in one click, never the thing
            your eye lands on first.
          */}
          {isAdmin ? (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-dotted border-rule-strong pt-3">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-ink-faint">
                This trip
              </span>
              {trip.archivedAt ? null : (
                <form action={archiveTripFromOverview}>
                  <input type="hidden" name="tripId" value={tripId} />
                  <ConfirmSubmit
                    variant="ghost"
                    message={`Archive "${trip.name}"? It comes off everyone's list and stays readable — any admin can bring it back from Archived.`}
                    confirmLabel="Archive it"
                    pendingLabel="Archiving…"
                  >
                    Archive
                  </ConfirmSubmit>
                </form>
              )}
              <form action={deleteTripFromOverview}>
                <input type="hidden" name="tripId" value={tripId} />
                <ConfirmSubmit
                  variant="danger"
                  message={`Delete "${trip.name}" for everyone? Nobody will be able to reopen it from the app — archive it instead if you might want it back.`}
                  confirmLabel="Delete it"
                  pendingLabel="Deleting…"
                >
                  Delete
                </ConfirmSubmit>
              </form>
            </div>
          ) : null}
        </section>

        <TripRoster
          tripId={tripId}
          viewerId={viewer.id}
          members={members}
          isAdmin={isAdmin}
          inviteUrl={isAdmin ? inviteUrl : undefined}
          friendStates={friendStates}
        />
      </div>

      {isBrandNew ? (
        <div className="mt-6">
          <EmptyState
            title="This trip is just a name so far"
            action={
              <ButtonLink href={`/trip/${tripId}/ideas`} variant="primary">
                Post the first idea
              </ButtonLink>
            }
          />
        </div>
      ) : (
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
      )}

      {/* Right-aligned: the page's least-used control, pulled to the opposite
          edge from every heading so it stops reading as the next section. */}
      <details className="mt-6 border-t border-rule pt-3.5 text-right">
        <summary className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-pen marker:content-['']">
          Trip settings
        </summary>
        {/* No trip name field here any more — it moved into the hero, next to
            the name itself (ticket 37). */}
        <div className="mt-3.5 grid gap-4 text-left sm:grid-cols-2">
          {isAdmin ? (
            <>
              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-faint">
                  Invite link
                </span>
                <div>
                  <CopyLink value={inviteUrl} />
                </div>
                <span className="text-xs text-ink-faint">
                  Anyone holding it can join.
                </span>
              </div>

              {/* Hidden on a solo trip — a "Members" heading over an empty
                  list is a shelf advertising that it's bare. */}
              <Stack
                gap={2}
                className={cx(
                  "sm:col-span-2",
                  members.length === 1 && "hidden",
                )}
              >
                {/* Promoting only. Kicking moved onto the roster's own rows
                    (ticket 38), so this list is no longer a second member
                    list with its own copy of every control. */}
                <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-faint">
                  Make someone an admin
                </span>
                <ul className="flex flex-col gap-2">
                  {members
                    .filter((m) => m.userId !== viewer.id)
                    .map((m) => (
                      <li
                        key={m.userId}
                        className="flex items-center justify-between gap-2 rounded-sm border border-rule px-2.5 py-1.5"
                      >
                        <span className="flex items-center gap-2 text-sm">
                          <Avatar
                            name={m.name}
                            src={m.avatarUrl}
                            size={20}
                            tone={m.tone}
                          />
                          {m.name}
                          {m.role === "admin" ? <Badge tone="marine">Admin</Badge> : null}
                        </span>
                        <span className="flex gap-1">
                          {m.role !== "admin" ? (
                            <form action={promoteMember}>
                              <input type="hidden" name="tripId" value={tripId} />
                              <input type="hidden" name="userId" value={m.userId} />
                              <SubmitButton variant="ghost" pendingLabel="…">
                                Promote
                              </SubmitButton>
                            </form>
                          ) : null}
                        </span>
                      </li>
                    ))}
                </ul>
              </Stack>

              {/* Archiving and deleting used to sit here (ticket 66). They
                  moved up into the hero in ticket 72 — the fold was the
                  complaint, and leaving a second copy behind would be two ways
                  to delete the same trip. Archived is still reached from
                  /trips/archived, as it always was. */}
            </>
          ) : (
            <p className="text-sm text-ink-soft">
              Inviting, promoting and removing people are admin-only.
            </p>
          )}

          {/* Tags used to be edited here. They moved up beside where they
              display, on the hero (ticket 86) — same complaint as ticket 72's
              archive and delete, and leaving a copy behind would be two places
              to edit one label. */}

          {/* Leaving is not an admin power (ticket 65), so it sits outside the
              admin block and every member sees it. The confirm copy carries
              whichever consequence applies — see `leaveTrip`. */}
          <Stack gap={2} className="border-t border-rule pt-4 sm:col-span-2">
            <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-faint">
              Leave trip
            </span>
            <p className="text-xs text-ink-faint">
              You come off the roster. Anything you&rsquo;ve already posted, paid
              or voted for stays where it is.
            </p>
            <form action={leaveTrip}>
              <input type="hidden" name="tripId" value={tripId} />
              <ConfirmSubmit
                variant="secondary"
                message={leaveWarning}
                confirmLabel="Leave the trip"
                pendingLabel="Leaving…"
              >
                Leave trip
              </ConfirmSubmit>
            </form>
          </Stack>
        </div>
      </details>
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
