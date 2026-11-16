import "server-only";

import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { availability } from "@/db/schema";
import { listIdeas } from "@/server/ideas/ideas-read";

export type GuestIdea = { id: number; title: string; votes: number; mine: boolean };

export async function guestIdeas(tripId: number, guestId: string | null): Promise<GuestIdea[]> {
  const ideas = await listIdeas(tripId, guestId ?? "");
  return ideas.map((i) => ({ id: i.id, title: i.title, votes: i.votes, mine: i.mine }));
}

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
