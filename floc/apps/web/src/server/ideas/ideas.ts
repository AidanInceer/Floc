/**
 * `idea` + `idea_vote` writes; reads are in `ideas-read.ts`.
 *
 * Why: removing is open to every member, not just the author — an idea belongs
 * to the group, and the admin powers stay kick/promote/delete/re-lock.
 */
import "server-only";

import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { idea, ideaVote } from "@/db/schema";
import { TEXT_CAPS } from "@floc/core/text/text";
import { touch } from "@/server/audit";

export const IDEA_TITLE_MAX = TEXT_CAPS.ideaTitle;

/** One live idea of this trip's. Scoped by trip, so a foreign id reads as gone. */
export async function findIdea(tripId: number, ideaId: number) {
  return db
    .select({ id: idea.id, title: idea.title, createdBy: idea.createdBy })
    .from(idea)
    .where(and(eq(idea.id, ideaId), eq(idea.tripId, tripId), isNull(idea.deletedAt)))
    .get();
}

export async function insertIdea(args: {
  tripId: number;
  createdBy: string;
  title: string;
}): Promise<number> {
  const row = await db
    .insert(idea)
    .values({ ...args, title: args.title.slice(0, IDEA_TITLE_MAX) })
    .returning({ id: idea.id })
    .get();
  return row.id;
}

export async function softDeleteIdea(tripId: number, ideaId: number): Promise<void> {
  await db
    .update(idea)
    .set({ deletedAt: new Date(), ...touch() })
    .where(and(eq(idea.id, ideaId), eq(idea.tripId, tripId), isNull(idea.deletedAt)));
}

/** Un-voting revives the same row rather than inserting a second (rule 8), so two taps together cannot count twice. */
export async function toggleIdeaVote(ideaId: number, userId: string): Promise<void> {
  const existing = await db
    .select({ deletedAt: ideaVote.deletedAt })
    .from(ideaVote)
    .where(and(eq(ideaVote.ideaId, ideaId), eq(ideaVote.userId, userId)))
    .get();

  const deletedAt = existing && !existing.deletedAt ? new Date() : null;

  await db
    .insert(ideaVote)
    .values({ ideaId, userId, deletedAt })
    .onConflictDoUpdate({
      target: [ideaVote.ideaId, ideaVote.userId],
      set: { deletedAt, ...touch() },
    });
}
