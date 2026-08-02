"use server";

/**
 * Server actions for the ideas board (ticket 14).
 * Reads go through requireTripAccess; the SQL and the last-write-wins `touch()`
 * are `server/ideas.ts`'s job (ticket 108), so nothing here imports `@/db`.
 *
 * Availability lives in `../dates/actions.ts` now — it was here only because
 * the grid used to sit at the bottom of this page.
 */
import { after } from "next/server";

import { capRequiredText } from "@/lib/text";
import { requireTripAccess, assertAdmin } from "@/server/access";
import { emails, sendEmails } from "@/server/email";
import {
  castVote as writeVote,
  clearVote as writeClearVote,
  insertIdea,
  revalidateIdeas,
  revalidateIdeasAndTabs,
  setIdeaPinnedAt,
  softDeleteIdea,
} from "@/server/ideas";
import { refreshUnlocks } from "@/server/unlocks";
import type { VoteValue } from "@/db/schema";

/**
 * Posting the first idea is what sticky-unlocks Route (ticket 04/13), so
 * every post calls refreshUnlocks — cheap no-op once already unlocked.
 */
export async function postIdea(tripId: number, formData: FormData) {
  const access = await requireTripAccess(tripId);
  const note = capRequiredText(formData.get("note"), "ideaNote");
  if (!note) throw new Error("An idea needs some words");

  await insertIdea(access.trip.id, access.viewer.id, note);
  await refreshUnlocks(access.trip.id);

  const others = access.members.filter((m) => m.userId !== access.viewer.id);
  // Mail is a side effect of the write, not part of it (ticket 111): `after()`
  // returns the board as soon as the idea is stored and sends once the
  // response has flushed, so a slow provider never slows the post.
  after(() =>
    sendEmails(
      others.map((m) =>
        emails.ideaPosted({
          to: m.email,
          toUserId: m.userId,
          tripId: access.trip.id,
          tripName: access.trip.name,
          fromName: access.viewer.name,
          idea: note,
        }),
      ),
    ),
  );

  revalidateIdeasAndTabs(access.trip.id);
}

/**
 * Soft-delete only, author or any admin (ticket 14) — deliberately not
 * author-only, so a stale/off-topic idea can't get stuck if the poster has
 * gone quiet. No hard delete anywhere: idea threads are a shared record.
 */
export async function deleteIdea(tripId: number, ideaId: number) {
  const access = await requireTripAccess(tripId);
  const row = await access.idea(ideaId);

  if (row.createdBy !== access.viewer.id) assertAdmin(access);

  await softDeleteIdea(row.id);

  revalidateIdeas(access.trip.id);
}

/**
 * Pin or unpin an idea (v0.2 ticket 09). Any member, not author-or-admin: a
 * pin is "the group is looking at this one", which is exactly the sort of
 * thing a member should be able to say. Group-wide state, last-write-wins
 * like everything else (CLAUDE.md rule 7) — no per-viewer pinning.
 */
export async function setIdeaPinned(tripId: number, ideaId: number, pinned: boolean) {
  const access = await requireTripAccess(tripId);
  const row = await access.idea(ideaId);

  await setIdeaPinnedAt(row.id, pinned);

  revalidateIdeas(access.trip.id);
}

/** One vote per person per idea — the upsert lives in `server/ideas.ts`. */
export async function castVote(tripId: number, ideaId: number, value: VoteValue) {
  const access = await requireTripAccess(tripId);
  const target = await access.idea(ideaId);

  await writeVote(target.id, access.viewer.id, value);

  revalidateIdeas(access.trip.id);
}

/** Abstaining is legitimate (ticket 14) — this lets someone undo a vote. */
export async function clearVote(tripId: number, ideaId: number) {
  const access = await requireTripAccess(tripId);
  const target = await access.idea(ideaId);
  await writeClearVote(target.id, access.viewer.id);
  revalidateIdeas(access.trip.id);
}
