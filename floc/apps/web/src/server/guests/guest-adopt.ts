import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { availability, idea, ideaVote } from "@/db/schema";
import { isRefusal } from "@floc/core/errors/refusal";
import { touch } from "@/server/audit";
import { findGuest, removeGuest } from "@/server/guests/guests";
import { joinWithLink } from "@/server/trips/invites";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function tripsAnswered(guestId: string): Promise<number[]> {
  const [marks, votes] = await Promise.all([
    db.selectDistinct({ tripId: availability.tripId }).from(availability).where(eq(availability.userId, guestId)).all(),
    db
      .selectDistinct({ tripId: idea.tripId })
      .from(ideaVote)
      .innerJoin(idea, eq(idea.id, ideaVote.ideaId))
      .where(eq(ideaVote.userId, guestId))
      .all(),
  ]);
  return [...new Set([...marks, ...votes].map((r) => r.tripId))];
}

async function moveVotes(tx: Tx, tripId: number, guestId: string, accountId: string) {
  const tripIdeas = tx.select({ id: idea.id }).from(idea).where(eq(idea.tripId, tripId));
  const theirs = await tx
    .select()
    .from(ideaVote)
    .where(and(eq(ideaVote.userId, guestId), inArray(ideaVote.ideaId, tripIdeas)))
    .all();

  for (const vote of theirs) {
    const own = await tx
      .select({ id: ideaVote.id, deletedAt: ideaVote.deletedAt })
      .from(ideaVote)
      .where(and(eq(ideaVote.ideaId, vote.ideaId), eq(ideaVote.userId, accountId)))
      .get();
    if (!own) {
      await tx.update(ideaVote).set({ userId: accountId, ...touch() }).where(eq(ideaVote.id, vote.id));
      continue;
    }
    if (own.deletedAt && !vote.deletedAt) {
      await tx.update(ideaVote).set({ deletedAt: null, ...touch() }).where(eq(ideaVote.id, own.id));
    }
    await tx.delete(ideaVote).where(eq(ideaVote.id, vote.id));
  }
}

async function moveMarks(tx: Tx, tripId: number, guestId: string, accountId: string) {
  const theirs = await tx
    .select()
    .from(availability)
    .where(and(eq(availability.userId, guestId), eq(availability.tripId, tripId)))
    .all();

  for (const mark of theirs) {
    const own = await tx
      .select({ id: availability.id })
      .from(availability)
      .where(and(eq(availability.tripId, tripId), eq(availability.userId, accountId), eq(availability.date, mark.date)))
      .get();
    if (own) await tx.delete(availability).where(eq(availability.id, mark.id));
    else await tx.update(availability).set({ userId: accountId, ...touch() }).where(eq(availability.id, mark.id));
  }
}

export async function adoptGuest(guestId: string, accountId: string): Promise<void> {
  if (guestId === accountId || !(await findGuest(guestId))) return;

  for (const tripId of await tripsAnswered(guestId)) {
    try {
      await joinWithLink(tripId, accountId);
    } catch (error) {
      if (!isRefusal(error)) throw error;
      await removeGuest(tripId, guestId);
      continue;
    }
    await db.transaction(async (tx) => {
      await moveVotes(tx, tripId, guestId, accountId);
      await moveMarks(tx, tripId, guestId, accountId);
    });
  }
}
