/**
 * The ideas aggregate — `idea` and `idea_vote` (ticket 108). Owns soft-delete
 * (rule 8, see `castVote`), the board's ceiling (`LIMITS.ideas`), and reads
 * composed per aggregate rather than a per-page loader (ticket 118) — more
 * than one page wants `listVotes`, for different questions.
 */
import "server-only";

import { and, count, desc, eq, inArray, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { idea, ideaVote, user, userProfile } from "@/db/schema";
import type { VoteValue } from "@/db/schema";
import { bounded, LIMITS } from "@/server/limits";
import { touch } from "@/server/audit";

/** Board only — the layout-wide revalidate ticket 126 dropped with the tab unlocks. */
export function revalidateIdeas(tripId: number): void {
  revalidatePath(`/trip/${tripId}/ideas`);
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

/** The board, newest first, with each idea's author joined in (ticket 118) — a fact about ideas, not the page. */
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

/** Ids only, for Overview's "who hasn't voted" (ticket 109) — skips reading note/author for a full board. */
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

/** "Needs you" probe on `/trips` (ticket 118) — set membership, not a count; cheap over complete (ticket 17). */
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
 * Every live vote on the trip's live ideas (ticket 118). Scoped by joining
 * `idea` on `trip_id`, not by ids from the board read, so this can run
 * alongside `listIdeas` instead of after it. Name/avatar ride along because a
 * voter may since have left the trip, so the roster can't fill them in.
 * Ceiling: `ideas` × `members`.
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

/** Bulk insert, given order — Explore's "start this trip" seed (ticket 39); all posted by the starter since there's no system author. */
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
    .where(and(eq(idea.id, ideaId), isNull(idea.deletedAt)));
}

/** Edit an idea's text — author or admin, last-write-wins (rule 7). */
export async function updateIdeaNote(ideaId: number, note: string): Promise<void> {
  await db
    .update(idea)
    .set({ note, ...touch() })
    .where(and(eq(idea.id, ideaId), isNull(idea.deletedAt)));
}

/** Pin or unpin — group-wide, last-write-wins (rule 7), no per-viewer state. */
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
      // deletedAt: null is load-bearing: the unique index doesn't know about
      // soft-delete, so a cleared row blocks re-insert and, unreset, silently
      // eats a re-vote after clear.
      set: { value, deletedAt: null, ...touch() },
    });
}

/** Undo a vote — abstaining is legitimate (ticket 14). */
export async function clearVote(ideaId: number, userId: string): Promise<void> {
  await db
    .update(ideaVote)
    .set({ deletedAt: new Date(), ...touch() })
    .where(and(eq(ideaVote.ideaId, ideaId), eq(ideaVote.userId, userId)));
}
