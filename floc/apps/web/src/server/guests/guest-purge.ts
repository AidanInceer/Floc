import "server-only";

import { and, eq, inArray, lte } from "drizzle-orm";

import { db } from "@/db";
import { availability, ideaVote, user } from "@/db/schema";
import { guestCutoff } from "@floc/core/people/guests";

export async function purgeOldGuests(now = new Date()): Promise<number> {
  const old = await db
    .select({ id: user.id })
    .from(user)
    .where(and(eq(user.isAnonymous, true), lte(user.createdAt, guestCutoff(now))))
    .all();
  const ids = old.map((r) => r.id);
  if (ids.length === 0) return 0;

  await db.transaction(async (tx) => {
    await tx.delete(ideaVote).where(inArray(ideaVote.userId, ids));
    await tx.delete(availability).where(inArray(availability.userId, ids));
    await tx.delete(user).where(and(inArray(user.id, ids), eq(user.isAnonymous, true)));
  });
  return ids.length;
}
