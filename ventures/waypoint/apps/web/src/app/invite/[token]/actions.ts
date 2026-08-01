"use server";

/**
 * Join-by-link action (ticket 01 step 2, ticket 05). Anyone holding the
 * token can join — no per-invitee tracking, membership just gets created.
 */
import { and, eq, isNull } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { trip, tripMembership } from "@/db/schema";
import { requireUser } from "@/server/access";
import { ensureProfile } from "@/server/profile";

export async function joinTrip(token: string) {
  const redirectTo = `/invite/${token}`;
  const user = await requireUser(redirectTo);

  const found = await db
    .select({ id: trip.id })
    .from(trip)
    .where(and(eq(trip.inviteToken, token), isNull(trip.deletedAt)))
    .get();
  if (!found) notFound();

  // The composite PK means a previously kicked member already has a row, just
  // soft-deleted — so this must revive it rather than no-op, or a kick would
  // permanently bar someone the group has since re-invited.
  await db
    .insert(tripMembership)
    .values({ tripId: found.id, userId: user.id, role: "member" })
    .onConflictDoUpdate({
      target: [tripMembership.tripId, tripMembership.userId],
      // `map_prompt_at` clears with the rejoin: rejoining answers the "keep
      // this trip's countries?" question by making it moot (ticket 95).
      set: { deletedAt: null, mapPromptAt: null, lastModifiedAt: new Date() },
    });

  // Lazily creates a profile for anyone who joined via link before signup
  // fully wired one up (belt-and-braces; signup already calls this too).
  await ensureProfile(user.id);

  revalidatePath(`/trip/${found.id}/overview`);
  redirect(`/trip/${found.id}/overview`);
}
