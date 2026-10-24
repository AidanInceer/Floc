/**
 * Guests on an invite link (#442, ADR-029). A guest is a `user` row with
 * `is_anonymous` and never a member. They are "on" a trip by the answers they
 * gave it — a vote or a date mark — so nothing else records the link.
 *
 * Why the hard deletes: a guest is not a person with an account, and a guest who
 * is removed leaves nothing behind. The second exception to rule 8 after ADR-017,
 * and every delete here is gated on `is_anonymous`, so it cannot reach a member.
 */
import "server-only";

import { and, eq, inArray, isNull } from "drizzle-orm";

import { db } from "@/db";
import { availability, idea, ideaVote, user } from "@/db/schema";
import { Refusal } from "@floc/core/errors/refusal";
import { GUEST_CAP } from "@floc/core/people/guests";

export type Guest = { id: string; name: string };

export async function findGuest(userId: string): Promise<Guest | null> {
  const row = await db
    .select({ id: user.id, name: user.name })
    .from(user)
    .where(and(eq(user.id, userId), eq(user.isAnonymous, true)))
    .get();
  return row ?? null;
}

async function guestIdsOn(tripId: number): Promise<string[]> {
  const [marks, votes] = await Promise.all([
    db
      .selectDistinct({ id: availability.userId })
      .from(availability)
      .innerJoin(user, eq(user.id, availability.userId))
      .where(and(eq(availability.tripId, tripId), isNull(availability.deletedAt), eq(user.isAnonymous, true)))
      .all(),
    db
      .selectDistinct({ id: ideaVote.userId })
      .from(ideaVote)
      .innerJoin(idea, eq(idea.id, ideaVote.ideaId))
      .innerJoin(user, eq(user.id, ideaVote.userId))
      .where(and(eq(idea.tripId, tripId), isNull(ideaVote.deletedAt), eq(user.isAnonymous, true)))
      .all(),
  ]);
  return [...new Set([...marks, ...votes].map((r) => r.id))];
}

export async function listGuests(tripId: number): Promise<Guest[]> {
  const ids = await guestIdsOn(tripId);
  if (ids.length === 0) return [];
  return db
    .select({ id: user.id, name: user.name })
    .from(user)
    .where(and(inArray(user.id, ids), eq(user.isAnonymous, true)))
    .orderBy(user.createdAt)
    .all();
}

/** A guest already on the trip may always change their answer; a new one (or one not made yet: null) waits for room. */
export async function assertGuestRoom(tripId: number, guestId: string | null): Promise<void> {
  const ids = await guestIdsOn(tripId);
  if (guestId && ids.includes(guestId)) return;
  if (ids.length >= GUEST_CAP) {
    throw new Refusal("This trip is full of guests. Make a free account to answer.");
  }
}

/** `false` when the id is not a guest, so a member's answers can never be taken this way. */
export async function removeGuest(tripId: number, guestId: string): Promise<boolean> {
  if (!(await findGuest(guestId))) return false;
  const tripIdeas = db.select({ id: idea.id }).from(idea).where(eq(idea.tripId, tripId));
  await db.transaction(async (tx) => {
    await tx.delete(ideaVote).where(and(eq(ideaVote.userId, guestId), inArray(ideaVote.ideaId, tripIdeas)));
    await tx.delete(availability).where(and(eq(availability.userId, guestId), eq(availability.tripId, tripId)));
  });
  return true;
}
