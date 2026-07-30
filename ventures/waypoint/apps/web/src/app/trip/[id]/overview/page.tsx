/**
 * Trip dashboard (v1 ticket 13) — the landing every member sees after login.
 * Trip name/dates/avatars already render in the trip layout header, so this
 * page starts below that.
 *
 * Re-laid out by v0.2 ticket 07. What the page *says* is unchanged from
 * ticket 13; the arrangement is not:
 *
 *   - A hero, split 65/35: where the planning is at, and who's doing it. The
 *     "up to" sentence gets the page's largest type, with the trail drawing
 *     the same answer spatially.
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
  type Currency,
} from "@/db/schema";
import { requireTripAccess } from "@/lib/access";
import { computeBalances, formatMoney } from "@/lib/money";
import { formatDateRange, hasEnded } from "@/lib/dates";
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
import { TripRoster } from "@/components/trip-roster";
import { TripTrail, type Station } from "@/components/trip-trail";
import { TagEditor } from "@/components/tag-editor";
import { readTagTones, readTags, tagTone, type TagTone } from "@/lib/tags";
import {
  archiveTripFromOverview,
  deleteTripFromOverview,
  leaveTrip,
  promoteMember,
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

  const isBrandNew = ideas.length === 0;
  const hasDays = dayRows.length > 0;

  // --- Unresolved: idea voting -------------------------------------------
  let votingUnresolved: typeof members = [];
  let viewerHasVotedAll = true;
  if (ideas.length > 0) {
    const votedIdeasByUser = new Map<string, Set<number>>();
    for (const v of votes) {
      const set = votedIdeasByUser.get(v.userId) ?? new Set<number>();
      set.add(v.ideaId);
      votedIdeasByUser.set(v.userId, set);
    }
    votingUnresolved = members.filter(
      (m) => (votedIdeasByUser.get(m.userId)?.size ?? 0) < ideas.length,
    );
    viewerHasVotedAll = (votedIdeasByUser.get(viewer.id)?.size ?? 0) >= ideas.length;
  }

  // --- Unresolved: availability, only while dates are still unset --------
  const datesUnset = !trip.startDate && !trip.endDate;
  let availabilityUnresolved: typeof members = [];
  let viewerHasAvailability = true;
  if (datesUnset) {
    const withAvailability = new Set(availabilityRows.map((r) => r.userId));
    availabilityUnresolved = members.filter((m) => !withAvailability.has(m.userId));
    viewerHasAvailability = withAvailability.has(viewer.id);
  }

  // --- Unresolved: money still owed ---------------------------------------
  const balances = computeBalances(
    expenseRows.map((e) => ({
      paidBy: e.paidBy,
      currency: e.currency,
      amountMinor: e.amountMinor,
      splits: splitRows
        .filter((s) => s.expenseId === e.id)
        .map((s) => ({
          userId: s.userId,
          owedAmountMinor: s.owedAmountMinor,
          settled: !!s.settledAt,
        })),
    })),
  );
  // People, not per-currency entries — otherwise a group owing in two
  // currencies reads as twice as many outstanding things as it has.
  const moneyUnresolved = Array.from(
    new Set(
      Object.values(balances).flatMap((book) =>
        Object.entries(book)
          .filter(([, amount]) => amount !== 0)
          .map(([userId]) => userId),
      ),
    ),
  );
  // The viewer's own position, per currency, so their row can say the actual
  // number rather than "someone owes something".
  const viewerPositions = (Object.entries(balances) as [Currency, Record<string, number>][])
    .map(([currency, book]) => ({ currency, amount: book[viewer.id] ?? 0 }))
    .filter((p) => p.amount !== 0);
  const othersUnresolved = moneyUnresolved.filter((u) => u !== viewer.id);

  /*
   * Where the trip is up to, derived, no lifecycle column (rule 4).
   *
   * It used to be one sentence in the page's largest type under an "Up to"
   * kicker, which meant the headline changed length every time the trip moved
   * and the ended case read "Ended — still editable if anything's unfinished":
   * a label and its caveat welded together and shouted. Ticket 89 splits them.
   * The stage is now a *badge* — one or two words, the same vocabulary the
   * rest of the app uses for state — and whatever else needs saying drops to a
   * plain line underneath, at the size a reassurance deserves.
   */
  const ended = hasEnded(trip.endDate);
  const countdown = ended ? null : countdownLabel(trip.startDate);
  const stage: { label: string; tone: "neutral" | "marine" | "open" } = isBrandNew
    ? { label: "Not started", tone: "open" }
    : ended
      ? { label: "Ended", tone: "neutral" }
      : hasDays
        ? { label: "Underway", tone: "marine" }
        : { label: "Planning", tone: "marine" };
  const stageNote = isBrandNew
    ? "Nothing posted yet — the first idea is what gets a trip moving."
    : ended
      ? "Still open — nothing about a finished trip is read-only."
      : hasDays
        ? trip.startDate
          ? "The itinerary is being sketched day by day."
          : "The itinerary is being sketched — the dates still aren't agreed."
        : "Picking ideas and a route.";

  /*
   * The trail. Every station is derived from the rows above; `now` marks the
   * one place the group is actually working, and at most one station may hold
   * it — two "you are here" markers make nonsense of a route. A tab that has
   * fallen behind is `snag` instead, which is the same blue in a hollow ring.
   */
  const placeCount = new Set(
    dayRows.map((d) => d.overnightPlaceId).filter((p): p is number => p !== null),
  ).size;
  const routeUnlocked = trip.routeUnlockedAt !== null;
  const daysUnlocked = trip.daysUnlockedAt !== null;

  const stations: Station[] = [
    {
      key: "ideas",
      label: "Ideas",
      caption: isBrandNew
        ? "start here"
        : `${ideas.length} posted${votingUnresolved.length ? "" : ", all voted"}`,
      state: isBrandNew ? "now" : votingUnresolved.length ? "snag" : "done",
    },
    {
      key: "dates",
      label: "Dates",
      // Not the range itself — it is already on the line above, and at three
      // words it was the one caption that wrapped the trail on a phone.
      caption: datesUnset ? "still open" : "agreed",
      state: datesUnset ? (isBrandNew ? "ahead" : "snag") : "done",
    },
    {
      key: "route",
      label: "Route",
      caption: !routeUnlocked
        ? "locked"
        : placeCount
          ? `${placeCount} ${placeCount === 1 ? "place" : "places"}`
          : "nothing yet",
      state: !routeUnlocked ? "locked" : placeCount ? "done" : "ahead",
    },
    {
      key: "days",
      label: "Days",
      caption: !daysUnlocked
        ? "locked"
        : hasDays
          ? `${dayRows.length} sketched`
          : "nothing yet",
      // The only station that claims "now" — once Days is open, sketching the
      // itinerary is what the group is doing, whatever else is outstanding.
      state: !daysUnlocked ? "locked" : hasDays ? "now" : "ahead",
    },
    {
      key: "money",
      label: "Money",
      caption: expenseRows.length
        ? `${expenseRows.length} ${expenseRows.length === 1 ? "expense" : "expenses"}`
        : "nothing yet",
      state: expenseRows.length ? (moneyUnresolved.length ? "snag" : "done") : "ahead",
    },
  ];
  // Ideas is where you are when there's nothing else open yet.
  if (!stations.some((s) => s.state === "now")) stations[0].state = "now";

  const inviteUrl = `${process.env.BETTER_AUTH_URL ?? "http://localhost:3000"}/invite/${trip.inviteToken}`;
  const tags = readTags(trip.tags);
  const tagTones = readTagTones(trip.tagTones);

  /*
   * What leaving costs, worked out here so the dialog can say it before the
   * click rather than after (ticket 65). The three cases are the ones
   * `leaveTrip` actually branches on, and the heir is picked the same way —
   * earliest to join — so the name in the warning is the name that gets it.
   */
  const others = members.filter((m) => m.userId !== viewer.id);
  const heir =
    others.length > 0 && isAdmin && !others.some((m) => m.role === "admin")
      ? others.reduce((earliest, m) =>
          m.joinedAt < earliest.joinedAt ? m : earliest,
        )
      : null;
  const leaveWarning =
    others.length === 0
      ? `You're the only one in "${trip.name}", so leaving archives it. Nothing is deleted, but with nobody on the roster it can't be reopened from the app.`
      : heir
        ? `Leave "${trip.name}"? You're the only admin, so ${heir.name} becomes admin in your place.`
        : `Leave "${trip.name}"? You'll need a new invite link to come back.`;

  return (
    <Page wide flush>
      {/* Split 65/35: "up to" is the hero, the roster only needs room for a
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
            {votingUnresolved.filter((m) => m.userId !== viewer.id).length > 0 ? (
              <UnresolvedRow
                tab="Ideas"
                href={`/trip/${tripId}/ideas`}
                headline={`Waiting on ${peopleCount(votingUnresolved.filter((m) => m.userId !== viewer.id).length)} to vote on every idea`}
                people={votingUnresolved.filter((m) => m.userId !== viewer.id)}
              />
            ) : null}
            {availabilityUnresolved.filter((m) => m.userId !== viewer.id).length > 0 ? (
              <UnresolvedRow
                tab="Dates"
                href={`/trip/${tripId}/dates`}
                headline={`Waiting on ${peopleCount(availabilityUnresolved.filter((m) => m.userId !== viewer.id).length)} to share availability`}
                people={availabilityUnresolved.filter((m) => m.userId !== viewer.id)}
              />
            ) : null}
            {othersUnresolved.length > 0 ? (
              <UnresolvedRow
                tab="Money"
                href={`/trip/${tripId}/money`}
                headline={`Waiting on ${peopleCount(othersUnresolved.length)} to settle up`}
                people={members.filter((m) => othersUnresolved.includes(m.userId))}
              />
            ) : null}

            {viewerHasVotedAll &&
            viewerHasAvailability &&
            viewerPositions.length === 0 &&
            votingUnresolved.filter((m) => m.userId !== viewer.id).length === 0 &&
            availabilityUnresolved.filter((m) => m.userId !== viewer.id).length === 0 &&
            othersUnresolved.length === 0 ? (
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
