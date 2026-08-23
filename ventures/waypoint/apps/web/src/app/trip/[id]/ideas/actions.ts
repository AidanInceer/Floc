"use server";

// Server actions for the ideas board (ticket 14).
import { after } from "next/server";

import { capRequiredText } from "@/lib/text";
import { requireTripAccess, assertAdmin } from "@/server/access";
import { emails, sendEmails } from "@/server/email";
import {
  castVote as writeVote,
  clearVote as writeClearVote,
  insertIdea,
  revalidateIdeas,
  setIdeaPinnedAt,
  softDeleteIdea,
  updateIdeaNote,
} from "@/server/ideas";
import type { VoteValue } from "@/db/schema";

export async function postIdea(tripId: number, formData: FormData) {
  const access = await requireTripAccess(tripId);
  const note = capRequiredText(formData.get("note"), "ideaNote");
  if (!note) throw new Error("An idea needs some words");

  await insertIdea(access.trip.id, access.viewer.id, note);

  const others = access.members.filter((m) => m.userId !== access.viewer.id);
  // Mail isn't part of the write; after() sends once the response flushes (ticket 111).
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

  revalidateIdeas(access.trip.id);
}

// Author or any admin (ticket 14), not author-only, so a stale idea can't
// get stuck if the poster's gone quiet. Soft-delete only.
export async function deleteIdea(tripId: number, ideaId: number) {
  const access = await requireTripAccess(tripId);
  const row = await access.idea(ideaId);

  if (row.createdBy !== access.viewer.id) assertAdmin(access);

  await softDeleteIdea(row.id);

  revalidateIdeas(access.trip.id);
}

// Edit the text — author or any admin, same rule as delete (ticket 14).
export async function editIdea(tripId: number, ideaId: number, formData: FormData) {
  const access = await requireTripAccess(tripId);
  const row = await access.idea(ideaId);

  if (row.createdBy !== access.viewer.id) assertAdmin(access);

  const note = capRequiredText(formData.get("note"), "ideaNote");
  if (!note) throw new Error("An idea needs some words");

  await updateIdeaNote(row.id, note);

  revalidateIdeas(access.trip.id);
}

// Any member, not author-or-admin (v0.2 ticket 09) — group-wide state,
// last-write-wins (rule 7), no per-viewer pinning.
export async function setIdeaPinned(tripId: number, ideaId: number, pinned: boolean) {
  const access = await requireTripAccess(tripId);
  const row = await access.idea(ideaId);

  await setIdeaPinnedAt(row.id, pinned);

  revalidateIdeas(access.trip.id);
}

export async function castVote(tripId: number, ideaId: number, value: VoteValue) {
  const access = await requireTripAccess(tripId);
  const target = await access.idea(ideaId);

  await writeVote(target.id, access.viewer.id, value);

  revalidateIdeas(access.trip.id);
}

export async function clearVote(tripId: number, ideaId: number) {
  const access = await requireTripAccess(tripId);
  const target = await access.idea(ideaId);
  await writeClearVote(target.id, access.viewer.id);
  revalidateIdeas(access.trip.id);
}
