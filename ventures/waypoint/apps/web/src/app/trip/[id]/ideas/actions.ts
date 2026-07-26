"use server";

/**
 * Server actions for the ideas board (ticket 14).
 * Reads go through requireTripAccess; every write bumps last_modified_at via
 * touch() (ticket 12: blanket last-write-wins, no optimistic locking).
 *
 * Availability lives in `../dates/actions.ts` now — it was here only because
 * the grid used to sit at the bottom of this page.
 */
import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { idea, ideaVote } from "@/db/schema";
import { requireTripAccess, assertAdmin } from "@/lib/access";
import { emails, sendEmail } from "@/lib/email";
import { refreshUnlocks, touch } from "@/lib/unlocks";
import type { VoteValue } from "@/db/schema";

/**
 * Posting the first idea is what sticky-unlocks Route (ticket 04/13), so
 * every post calls refreshUnlocks — cheap no-op once already unlocked.
 */
export async function postIdea(tripId: number, formData: FormData) {
  const access = await requireTripAccess(tripId);
  const note = String(formData.get("note") ?? "").trim();
  if (!note) throw new Error("An idea needs some words");

  await db.insert(idea).values({ tripId, createdBy: access.viewer.id, note });
  await refreshUnlocks(tripId);

  const others = access.members.filter((m) => m.userId !== access.viewer.id);
  await Promise.all(
    others.map((m) =>
      sendEmail(
        emails.ideaPosted({
          to: m.email,
          toUserId: m.userId,
          tripId,
          tripName: access.trip.name,
          fromName: access.viewer.name,
          idea: note,
        }),
      ),
    ),
  );

  revalidatePath(`/trip/${tripId}/ideas`);
  revalidatePath(`/trip/${tripId}`, "layout");
}

/**
 * Soft-delete only, author or any admin (ticket 14) — deliberately not
 * author-only, so a stale/off-topic idea can't get stuck if the poster has
 * gone quiet. No hard delete anywhere: idea threads are a shared record.
 */
export async function deleteIdea(tripId: number, ideaId: number) {
  const access = await requireTripAccess(tripId);
  const row = await db
    .select({ createdBy: idea.createdBy })
    .from(idea)
    .where(and(eq(idea.id, ideaId), eq(idea.tripId, tripId), isNull(idea.deletedAt)))
    .get();
  if (!row) return;

  if (row.createdBy !== access.viewer.id) assertAdmin(access);

  await db
    .update(idea)
    .set({ deletedAt: new Date(), ...touch() })
    .where(eq(idea.id, ideaId));

  revalidatePath(`/trip/${tripId}/ideas`);
}

/**
 * Pin or unpin an idea (v0.2 ticket 09). Any member, not author-or-admin: a
 * pin is "the group is looking at this one", which is exactly the sort of
 * thing a member should be able to say. Group-wide state, last-write-wins
 * like everything else (CLAUDE.md rule 7) — no per-viewer pinning.
 */
export async function setIdeaPinned(tripId: number, ideaId: number, pinned: boolean) {
  await requireTripAccess(tripId);

  await db
    .update(idea)
    .set({ pinnedAt: pinned ? new Date() : null, ...touch() })
    .where(and(eq(idea.id, ideaId), eq(idea.tripId, tripId), isNull(idea.deletedAt)));

  revalidatePath(`/trip/${tripId}/ideas`);
}

/** Upsert on the (ideaId, userId) unique index — one vote per person per idea. */
export async function castVote(tripId: number, ideaId: number, value: VoteValue) {
  const access = await requireTripAccess(tripId);

  await db
    .insert(ideaVote)
    .values({ ideaId, userId: access.viewer.id, value })
    .onConflictDoUpdate({
      target: [ideaVote.ideaId, ideaVote.userId],
      set: { value, ...touch() },
    });

  revalidatePath(`/trip/${tripId}/ideas`);
}

/** Abstaining is legitimate (ticket 14) — this lets someone undo a vote. */
export async function clearVote(tripId: number, ideaId: number) {
  const access = await requireTripAccess(tripId);
  await db
    .update(ideaVote)
    .set({ deletedAt: new Date(), ...touch() })
    .where(and(eq(ideaVote.ideaId, ideaId), eq(ideaVote.userId, access.viewer.id)));
  revalidatePath(`/trip/${tripId}/ideas`);
}
