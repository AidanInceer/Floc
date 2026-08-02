/**
 * The ideas aggregate — `idea` and `idea_vote` (ticket 108).
 *
 * The rules it owns, so no `actions.ts` writes them again:
 *
 * - **Soft-delete (rule 8)**, including on the vote upsert, where clearing the
 *   flag is load-bearing rather than tidy — see `castVote`.
 * - **The board's ceiling** is `LIMITS.ideas`, applied in `listIdeas` below.
 * - **The board's reads** (ticket 118) — see the note on the seam.
 *
 * ## Where the seam went (ticket 118)
 *
 * Ticket 108 moved the writes here and left the page reads on the pages. The
 * choice for the reads was between a loader per page and a read per aggregate,
 * and the reads are **per aggregate, composed on the page**:
 *
 * - A `loadIdeaBoard()` returning exactly the four things `ideas/page.tsx`
 *   wants is a module named after its only caller — shallow by construction,
 *   the trap ticket 108 called out, one layer up. `listVotes` is not: Overview
 *   reads it too, for a different question.
 * - The pages' `Promise.all` was deliberate — the reads were flattened once
 *   already so none waits on another — and it is the *page* that knows which
 *   of its reads are independent. Hiding them behind one loader either keeps
 *   that knowledge (and buries it) or loses it. So the page keeps the fan-out
 *   and the aggregate keeps the SQL, the joins, the soft-delete filter and the
 *   ceiling. No page is one round trip slower than it was.
 *
 * The one thing a page may no longer do is assemble a row shape from `@/db`
 * directly: an aggregate read hands back a shape, and the page maps it to
 * whatever the component wants.
 * - **Revalidation.** Posting an idea is what sticky-unlocks Route, so the
 *   layout goes with the board; a vote or a pin doesn't move the tab bar and
 *   takes the board alone. Two named revalidations rather than seven inline
 *   pairs a caller has to get right.
 */
import "server-only";

import { and, count, desc, eq, inArray, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { idea, ideaVote, user, userProfile } from "@/db/schema";
import type { VoteValue } from "@/db/schema";
import { bounded, LIMITS } from "@/server/limits";
import { touch } from "@/server/unlocks";

/** The board alone — a vote, a pin, a delete. */
export function revalidateIdeas(tripId: number): void {
  revalidatePath(`/trip/${tripId}/ideas`);
}

/**
 * The board *and* the tab bar. A first idea unlocks Route (ticket 04/13), and
 * the unlock is rendered by the trip layout, so a post that refreshed only the
 * board would leave the newly-unlocked tab greyed out until the next navigation.
 */
export function revalidateIdeasAndTabs(tripId: number): void {
  revalidateIdeas(tripId);
  revalidatePath(`/trip/${tripId}`, "layout");
}

export type IdeaRow = {
  id: number;
  note: string;
  pinnedAt: Date | null;
  createdAt: Date;
  createdBy: string;
  authorName: string;
  authorAvatar: string | null;
};

/**
 * The board, newest first, with each idea's author already on it (ticket 118).
 *
 * The author join is here rather than on the page because "an idea has a face
 * on it" is a fact about ideas, not about the board's layout — Overview asks
 * the same read a different question and gets the same rows.
 */
export async function listIdeas(tripId: number): Promise<IdeaRow[]> {
  const rows = await db
    .select({
      id: idea.id,
      note: idea.note,
      pinnedAt: idea.pinnedAt,
      createdAt: idea.createdAt,
      createdBy: idea.createdBy,
      authorName: user.name,
      authorAvatar: userProfile.avatarUrl,
    })
    .from(idea)
    .innerJoin(user, eq(user.id, idea.createdBy))
    .leftJoin(userProfile, eq(userProfile.userId, idea.createdBy))
    .where(and(eq(idea.tripId, tripId), isNull(idea.deletedAt)))
    .orderBy(desc(idea.createdAt))
    .limit(LIMITS.ideas)
    .all();
  return bounded(rows, "ideas", `trip ${tripId}`);
}

/**
 * Just the ids, for a caller that only wants to know what there is to vote on
 * — Overview's "who still hasn't voted" (ticket 109) needs no note and no
 * author, and a board of 500 is 500 rows it would otherwise read to count.
 */
export async function listIdeaIds(tripId: number): Promise<number[]> {
  const rows = await db
    .select({ id: idea.id })
    .from(idea)
    .where(and(eq(idea.tripId, tripId), isNull(idea.deletedAt)))
    .limit(LIMITS.ideas)
    .all();
  return bounded(rows, "ideas", `trip ${tripId}`).map((r) => r.id);
}

/** How many ideas are on the board — the invite teaser's one number about it. */
export async function countIdeas(tripId: number): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(idea)
    .where(and(eq(idea.tripId, tripId), isNull(idea.deletedAt)));
  return row?.value ?? 0;
}

/**
 * Which of these trips have anybody's idea on them (ticket 118) — the "needs
 * you" probe on `/trips`, one query for the whole list rather than one per
 * card. Deliberately a set-membership answer and not a count: the question is
 * "has this board been started", and ticket 17 asked for cheap, not complete.
 */
export async function tripIdsWithIdeas(tripIds: number[]): Promise<Set<number>> {
  if (tripIds.length === 0) return new Set();
  const rows = await db
    .selectDistinct({ tripId: idea.tripId })
    .from(idea)
    .where(and(inArray(idea.tripId, tripIds), isNull(idea.deletedAt)))
    .limit(LIMITS.tripsPerUser)
    .all();
  return new Set(bounded(rows, "tripsPerUser", "trip list").map((r) => r.tripId));
}

export type IdeaVoteRow = {
  ideaId: number;
  userId: string;
  value: VoteValue;
  name: string;
  avatarUrl: string | null;
};

/**
 * Every live vote on the trip's live ideas (ticket 118).
 *
 * Scoped by joining `idea` on `trip_id` rather than by an `inArray` over ids
 * the board read returns — that is what lets a caller fire this alongside
 * `listIdeas` instead of after it.
 *
 * The voter's name and picture ride along because a vote is shown as a face on
 * the board, and a voter may since have left the trip, so the roster can't
 * answer it. Overview only wants the (idea, person) pairs and ignores the rest;
 * two near-identical queries would be the worse trade.
 *
 * Ceiling: `ideas` × `members`, i.e. one vote each on a full board.
 */
export async function listVotes(tripId: number): Promise<IdeaVoteRow[]> {
  const rows = await db
    .select({
      ideaId: ideaVote.ideaId,
      userId: ideaVote.userId,
      value: ideaVote.value,
      name: user.name,
      avatarUrl: userProfile.avatarUrl,
    })
    .from(ideaVote)
    .innerJoin(idea, eq(idea.id, ideaVote.ideaId))
    .innerJoin(user, eq(user.id, ideaVote.userId))
    .leftJoin(userProfile, eq(userProfile.userId, ideaVote.userId))
    .where(
      and(
        eq(idea.tripId, tripId),
        isNull(idea.deletedAt),
        isNull(ideaVote.deletedAt),
      ),
    )
    .limit(LIMITS.ideas * LIMITS.members)
    .all();
  return rows;
}

export async function insertIdea(
  tripId: number,
  createdBy: string,
  note: string,
): Promise<void> {
  await insertIdeas(tripId, createdBy, [note]);
}

/**
 * Several ideas at once, in the given order. Explore's "start this trip" seeds
 * a preset's highlights this way — all posted by whoever started the trip,
 * because there is no system author and an idea needs a face on it for the
 * board to make sense (ticket 39).
 */
export async function insertIdeas(
  tripId: number,
  createdBy: string,
  notes: string[],
): Promise<void> {
  if (notes.length === 0) return;
  await db.insert(idea).values(notes.map((note) => ({ tripId, createdBy, note })));
}

export async function softDeleteIdea(ideaId: number): Promise<void> {
  await db
    .update(idea)
    .set({ deletedAt: new Date(), ...touch() })
    .where(eq(idea.id, ideaId));
}

/**
 * Pin or unpin. Group-wide state, last-write-wins like everything else (rule 7)
 * — there is no per-viewer pinning.
 */
export async function setIdeaPinnedAt(ideaId: number, pinned: boolean): Promise<void> {
  await db
    .update(idea)
    .set({ pinnedAt: pinned ? new Date() : null, ...touch() })
    .where(eq(idea.id, ideaId));
}

/** Upsert on the (ideaId, userId) unique index — one vote per person per idea. */
export async function castVote(
  ideaId: number,
  userId: string,
  value: VoteValue,
): Promise<void> {
  await db
    .insert(ideaVote)
    .values({ ideaId, userId, value })
    .onConflictDoUpdate({
      target: [ideaVote.ideaId, ideaVote.userId],
      // `deletedAt: null` is load-bearing, not tidiness. `clearVote` soft-deletes
      // (rule 8) but `idea_vote_unique_idx` doesn't know about `deletedAt`, so the
      // cleared row still blocks the insert — and without resetting the flag the
      // upsert wrote a new value onto a row every read filters out. Voting,
      // clearing, then voting again silently did nothing.
      set: { value, deletedAt: null, ...touch() },
    });
}

/** Abstaining is legitimate (ticket 14) — this is how someone undoes a vote. */
export async function clearVote(ideaId: number, userId: string): Promise<void> {
  await db
    .update(ideaVote)
    .set({ deletedAt: new Date(), ...touch() })
    .where(and(eq(ideaVote.ideaId, ideaId), eq(ideaVote.userId, userId)));
}
