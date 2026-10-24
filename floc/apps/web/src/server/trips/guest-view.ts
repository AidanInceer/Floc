/**
 * Everything a guest on a share link is allowed to read (#330, #442), and
 * nothing else: the ideas with their counts, and the guest's own days. One file
 * so the answer to "what can a stranger see?" is one file. The days, the files
 * and the group stay with the group.
 */
import "server-only";

import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { availability } from "@/db/schema";
import { listIdeas } from "@/server/ideas/ideas-read";

/** An idea as a guest sees it (#442): the title and the count. Who put it up and who voted are the group's. */
export type GuestIdea = { id: number; title: string; votes: number; mine: boolean };

export async function guestIdeas(tripId: number, guestId: string | null): Promise<GuestIdea[]> {
  const ideas = await listIdeas(tripId, guestId ?? "");
  return ideas.map((i) => ({ id: i.id, title: i.title, votes: i.votes, mine: i.mine }));
}

/** The guest's own free days and nobody else's (#442). */
export async function guestOwnDates(tripId: number, guestId: string | null): Promise<string[]> {
  if (!guestId) return [];
  const rows = await db
    .select({ date: availability.date })
    .from(availability)
    .where(
      and(
        eq(availability.tripId, tripId),
        eq(availability.userId, guestId),
        eq(availability.available, true),
        isNull(availability.deletedAt),
      ),
    )
    .orderBy(availability.date)
    .all();
  return rows.map((r) => r.date);
}
