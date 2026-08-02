/**
 * The ideas aggregate — `idea` and `idea_vote` (ticket 108).
 *
 * The rules it owns, so no `actions.ts` writes them again:
 *
 * - **Soft-delete (rule 8)**, including on the vote upsert, where clearing the
 *   flag is load-bearing rather than tidy — see `castVote`.
 * - **The board's ceiling** is `LIMITS.ideas`, applied where the board is read.
 *   That read is still on `ideas/page.tsx`; moving the page reads behind these
 *   aggregates is the follow-up to this ticket, and until it happens the ideas
 *   ceiling is written down without being enforced.
 * - **Revalidation.** Posting an idea is what sticky-unlocks Route, so the
 *   layout goes with the board; a vote or a pin doesn't move the tab bar and
 *   takes the board alone. Two named revalidations rather than seven inline
 *   pairs a caller has to get right.
 */
import "server-only";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { idea, ideaVote } from "@/db/schema";
import type { VoteValue } from "@/db/schema";
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
