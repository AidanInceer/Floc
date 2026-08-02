"use server";

/**
 * Discussion threads, shared by every surface that has one.
 *
 * The table's shape, the one-level rule, the body cap and the per-scope
 * revalidation all live in `server/notes.ts` (ticket 108). What's left here is
 * who may do what: not admin-gated, because anyone in the trip can say
 * something, and deleting follows `deleteIdea`'s rule — your own, or any
 * admin's, so a thread can't be held hostage by someone who's gone quiet.
 */
import { assertAdmin, requireTripAccess } from "@/server/access";
import {
  findNote,
  insertNote,
  resolveParent,
  revalidateThread,
  softDeleteNoteAndReplies,
  toggleReaction,
  updateNoteBody,
  NOTE_BODY_MAX,
} from "@/server/notes";
import type { NoteScope, ReactionKind } from "@/db/schema";

/**
 * Rewrite your own comment — for the typo you spot after posting.
 *
 * **Author only, and deliberately not an admin power.** Admin powers are
 * exactly four (rule 6) and this isn't one of them: an admin can *delete* a
 * comment, which is unambiguous, but putting different words in someone's
 * mouth under their own name is a different act entirely.
 *
 * Rule 7's last-write-wins means two people editing can't happen anyway — only
 * the author can, and there is one of them.
 */
export async function editNote(
  tripId: number,
  noteId: number,
  formData: FormData,
) {
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "A comment can't be empty — delete it instead." };

  const access = await requireTripAccess(tripId);
  const row = await findNote(tripId, noteId);
  if (!row) return { error: "That comment has gone." };
  if (row.createdBy !== access.viewer.id) {
    return { error: "You can only edit your own comments." };
  }

  // Reopening the editor and saving the same words shouldn't stamp "edited" on
  // a comment nobody changed.
  if (body.slice(0, NOTE_BODY_MAX) === row.body) return;

  await updateNoteBody(row.id, body);

  revalidateThread(tripId, row.scope);
}

export async function addNote(
  tripId: number,
  scope: NoteScope,
  scopeId: number,
  /** The comment being replied to, or null for a new top-level comment. */
  replyTo: number | null,
  formData: FormData,
) {
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Write something first." };

  const access = await requireTripAccess(tripId);

  let parentId: number | null = null;
  if (replyTo !== null) {
    // `undefined` means the target has gone; `null` means "top level".
    const resolved = await resolveParent({ tripId, scope, scopeId, replyTo });
    if (resolved === undefined) return { error: "That comment has gone." };
    parentId = resolved;
  }

  await insertNote({
    tripId,
    createdBy: access.viewer.id,
    scope,
    scopeId,
    parentId,
    body,
  });

  revalidateThread(tripId, scope);
}

/** Toggle one of the three reactions on a comment. */
export async function react(
  tripId: number,
  noteId: number,
  kind: ReactionKind,
) {
  const access = await requireTripAccess(tripId);

  const target = await findNote(tripId, noteId);
  if (!target) return;

  await toggleReaction(target.id, access.viewer.id, kind);

  revalidateThread(tripId, target.scope);
}

export async function deleteNote(tripId: number, noteId: number) {
  const access = await requireTripAccess(tripId);
  const row = await findNote(tripId, noteId);
  if (!row) return;

  if (row.createdBy !== access.viewer.id) assertAdmin(access);

  await softDeleteNoteAndReplies(row.id);

  revalidateThread(tripId, row.scope);
}
