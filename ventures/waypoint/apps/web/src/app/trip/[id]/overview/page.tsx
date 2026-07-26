/**
 * Trip dashboard (ticket 13) — the landing every member sees after login
 * (ticket 01 step 4). Trip name/dates/avatars already render in the trip
 * layout header, so this page starts below that.
 */
import Link from "next/link";
import { and, eq, inArray, isNull } from "drizzle-orm";

import { db } from "@/db";
import { availability, day, expense, expenseSplit, idea, ideaVote } from "@/db/schema";
import { requireTripAccess } from "@/lib/access";
import { computeBalances } from "@/lib/money";
import { formatDateRange, hasEnded } from "@/lib/dates";
import {
  Avatar,
  Badge,
  ButtonLink,
  Card,
  CardHeader,
  EmptyState,
  Input,
  Page,
  Stack,
} from "@/components/ui";
import {
  ActionForm,
  ConfirmSubmit,
  CopyLink,
  SubmitButton,
} from "@/components/client-ui";
import { NudgePanel } from "@/components/nudge-panel";
import {
  deleteTripFromOverview,
  kickMember,
  promoteMember,
  renameTrip,
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
   * Overview reads from four tables to build the "unresolved" list, and none
   * of those reads depends on another — so they go out together. Done
   * sequentially this page was the slowest tab in the app by a wide margin,
   * paying a full round trip per section.
   */
  const [ideas, availabilityRows, expenseRows, hasDays] = await Promise.all([
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
    db
      .select({ id: day.id })
      .from(day)
      .where(and(eq(day.tripId, tripId), isNull(day.deletedAt)))
      .get(),
  ]);

  const isBrandNew = ideas.length === 0;

  // The two follow-up reads that genuinely need the ids above. Also parallel.
  const [votes, splitRows] = await Promise.all([
    ideas.length
      ? db
          .select({ ideaId: ideaVote.ideaId, userId: ideaVote.userId })
          .from(ideaVote)
          // Scoped to this trip's ideas — an unscoped read would pull every
          // vote row in the database and lean on a JS filter to hide them.
          .where(
            and(
              inArray(
                ideaVote.ideaId,
                ideas.map((i) => i.id),
              ),
              isNull(ideaVote.deletedAt),
            ),
          )
          .all()
      : [],
    expenseRows.length
      ? db
          .select({
            expenseId: expenseSplit.expenseId,
            userId: expenseSplit.userId,
            owedAmountMinor: expenseSplit.owedAmountMinor,
            settledAt: expenseSplit.settledAt,
          })
          .from(expenseSplit)
          // Scoped to this trip's expenses, for the same reason.
          .where(
            and(
              inArray(
                expenseSplit.expenseId,
                expenseRows.map((e) => e.id),
              ),
              isNull(expenseSplit.deletedAt),
            ),
          )
          .all()
      : [],
  ]);

  // --- Unresolved: idea voting -------------------------------------------
  let votingUnresolved: typeof members = [];
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
  }

  // --- Unresolved: availability, only while dates are still unset --------
  let availabilityUnresolved: typeof members = [];
  if (!trip.startDate && !trip.endDate) {
    const withAvailability = new Set(availabilityRows.map((r) => r.userId));
    availabilityUnresolved = members.filter((m) => !withAvailability.has(m.userId));
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

  // --- Where the trip is up to, derived, no lifecycle column (ticket 04) --
  const stage = isBrandNew
    ? "Waiting for the first idea"
    : hasEnded(trip.endDate)
      ? "Ended — still editable if anything's unfinished"
      : hasDays
        ? trip.startDate
          ? "Itinerary underway"
          : "Building the itinerary — dates still to confirm"
        : "Picking ideas and a route";

  return (
    <Page wide flush>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          {isBrandNew ? (
            <EmptyState
              title="This trip is just a name so far"
              action={
                <ButtonLink href={`/trip/${tripId}/ideas`} variant="primary">
                  Post the first idea
                </ButtonLink>
              }
            >
              Nothing's been suggested yet. Post where you fancy going, then
              share the invite link below so the rest of the group can pile
              in and vote.
            </EmptyState>
          ) : null}

          <Card>
            <CardHeader title="At a glance" />
            <div className="flex flex-col gap-4 p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-soft">
                  Name
                </p>
                {/* Renameable by anyone in the trip, not just an admin — see
                    `renameTrip`. The header's <h1> stays read-only; the edit
                    lives on the page rather than in the chrome. */}
                <ActionForm action={renameTrip} className="mt-2">
                  <input type="hidden" name="tripId" value={tripId} />
                  <div className="flex flex-wrap items-end gap-2">
                    <Input
                      name="name"
                      defaultValue={trip.name}
                      maxLength={120}
                      aria-label="Trip name"
                      className="w-56"
                    />
                    <SubmitButton variant="secondary" pendingLabel="Saving…">
                      Rename
                    </SubmitButton>
                  </div>
                </ActionForm>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-soft">
                  Dates
                </p>
                {trip.startDate || trip.endDate ? (
                  <p className="mt-1 text-sm text-ink">
                    {formatDateRange(trip.startDate, trip.endDate)}{" "}
                    <Link
                      href={`/trip/${tripId}/dates`}
                      className="text-pen underline underline-offset-2"
                    >
                      Change
                    </Link>
                  </p>
                ) : (
                  // Deciding the dates is the Dates tab's whole job — a second
                  // pair of date inputs here would just be a way to set them
                  // without ever seeing whether the group is free.
                  <p className="mt-1 text-sm text-ink-soft">
                    Not set yet.{" "}
                    <Link
                      href={`/trip/${tripId}/dates`}
                      className="text-pen underline underline-offset-2"
                    >
                      Pick them on Dates
                    </Link>
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-soft">
                  Up to
                </p>
                <p className="mt-1 text-sm text-ink">{stage}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-soft">
                  Who's in
                </p>
                <ul className="mt-2 flex flex-col gap-2">
                  {members.map((m) => (
                    <li key={m.userId} className="flex items-center gap-2 text-sm">
                      <Avatar name={m.name} src={m.avatarUrl} size={24} tone={m.tone} />
                      <span>{m.name}</span>
                      {m.userId === viewer.id ? (
                        <span className="text-ink-faint">(you)</span>
                      ) : null}
                      {m.role === "admin" ? <Badge tone="marine">Admin</Badge> : null}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>

          {!isBrandNew ? (
            <Card>
              <CardHeader
                title="Unresolved"
                hint="What the group's still waiting on — nobody's chasing you for it automatically."
              />
              <div className="p-4">
                {votingUnresolved.length === 0 &&
                availabilityUnresolved.length === 0 &&
                moneyUnresolved.length === 0 ? (
                  <p className="text-sm text-ink-soft">
                    Nothing outstanding right now — everyone's caught up.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {votingUnresolved.length > 0 ? (
                      <li className="flex items-center justify-between gap-2 rounded-sm border border-rule px-3 py-2 text-sm">
                        <span>
                          <Badge tone="open">Ideas</Badge>{" "}
                          {votingUnresolved.length === 1
                            ? `${votingUnresolved[0].name} hasn't voted on every idea yet`
                            : `${votingUnresolved.length} people haven't voted on every idea yet`}
                        </span>
                        <Link href={`/trip/${tripId}/ideas`} className="text-pen underline">
                          Open Ideas
                        </Link>
                      </li>
                    ) : null}
                    {availabilityUnresolved.length > 0 ? (
                      <li className="flex items-center justify-between gap-2 rounded-sm border border-rule px-3 py-2 text-sm">
                        <span>
                          <Badge tone="open">Dates</Badge>{" "}
                          {availabilityUnresolved.length === 1
                            ? `${availabilityUnresolved[0].name} hasn't shared their availability`
                            : `${availabilityUnresolved.length} people haven't shared their availability`}
                        </span>
                        <Link href={`/trip/${tripId}/dates`} className="text-pen underline">
                          Open Dates
                        </Link>
                      </li>
                    ) : null}
                    {moneyUnresolved.length > 0 ? (
                      <li className="flex items-center justify-between gap-2 rounded-sm border border-rule px-3 py-2 text-sm">
                        <span>
                          <Badge tone="action">Money</Badge>{" "}
                          {moneyUnresolved.length === 1
                            ? "One person is still owed, or still owes"
                            : `${moneyUnresolved.length} people are still owed, or still owe`}
                        </span>
                        <Link href={`/trip/${tripId}/money`} className="text-pen underline">
                          Open Money
                        </Link>
                      </li>
                    ) : null}
                  </ul>
                )}
              </div>
            </Card>
          ) : null}

          <NudgePanel tripId={tripId} viewerId={viewer.id} members={members} />
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title="Admin" hint="Invite, kick and delete — nothing else differs by role." />
            <div className="flex flex-col gap-4 p-4">
              {isAdmin ? (
                <>
                  <Stack gap={2}>
                    <p className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-soft">
                      Invite
                    </p>
                    <CopyLink
                      value={`${process.env.BETTER_AUTH_URL ?? "http://localhost:3000"}/invite/${trip.inviteToken}`}
                    />
                  </Stack>

                  <Stack gap={2}>
                    <p className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-soft">
                      Members
                    </p>
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
                              <form action={kickMember}>
                                <input type="hidden" name="tripId" value={tripId} />
                                <input type="hidden" name="userId" value={m.userId} />
                                <ConfirmSubmit
                                  variant="danger"
                                  message={`Remove ${m.name} from this trip?`}
                                  pendingLabel="…"
                                >
                                  Kick
                                </ConfirmSubmit>
                              </form>
                            </span>
                          </li>
                        ))}
                    </ul>
                  </Stack>

                  <Stack gap={2} className="border-t border-rule pt-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-soft">
                      Delete trip
                    </p>
                    <p className="text-xs text-ink-faint">
                      Removes the trip for everyone. This can&rsquo;t be undone from here.
                    </p>
                    <form action={deleteTripFromOverview}>
                      <input type="hidden" name="tripId" value={tripId} />
                      <ConfirmSubmit
                        variant="danger"
                        message={`Delete "${trip.name}" for everyone? This can't be undone.`}
                        pendingLabel="Deleting…"
                      >
                        Delete trip
                      </ConfirmSubmit>
                    </form>
                  </Stack>
                </>
              ) : (
                <p className="text-sm text-ink-soft">Only an admin can invite people.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </Page>
  );
}
