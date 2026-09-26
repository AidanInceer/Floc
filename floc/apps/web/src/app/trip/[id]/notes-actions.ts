"use server";

// Discussion threads, shared by every surface that has one (server/notes/notes.ts
// owns the table shape, ticket 108). Anyone posts; only the author edits or
// deletes — removing someone else's words is not one of the admin powers.
import { requireTripAccess, type TripAccess } from "@/server/access";
import {
  findNote,
  insertNote,
  resolveParent,
  softDeleteNoteAndReplies,
  toggleReaction,
  updateNoteBody,
  NOTE_BODY_MAX,
} from "@/server/notes/notes";
import { REACTION_KINDS, type NoteScope, type ReactionKind } from "@/db/schema";
import { refresh } from "@/server/freshness";

/** The thread's subject must be this trip's (rule 5). Pages comment through their own actions. */
async function isOnTrip(access: TripAccess, scope: NoteScope, scopeId: number): Promise<boolean> {
  if (!Number.isInteger(scopeId)) return false;
  switch (scope) {
    case "trip":
      return scopeId === access.trip.id;
    case "day":
      return Boolean(await access.day(scopeId));
    case "day_event":
      return Boolean(await access.event(scopeId));
    case "expense":
      return Boolean(await access.expense(scopeId));
    default:
      return false;
  }
}

export async function editNote(
  tripId: number,
  noteId: number,
  formData: FormData,
) {
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "A comment can't be empty — delete it instead." };

  const access = await requireTripAccess(tripId);
  const row = await findNote(access.trip.id, noteId);
  if (!row) return { error: "That comment has gone." };
  if (row.createdBy !== access.viewer.id) {
    return { error: "You can only edit your own comments." };
  }

  // Don't stamp "edited" on a save that didn't change anything.
  if (body.slice(0, NOTE_BODY_MAX) === row.body) return;

  await updateNoteBody(row.id, body);

  refresh({ kind: "thread", tripId: access.trip.id, scope: row.scope });
}

export async function addNote(
  tripId: number,
  scope: NoteScope,
  scopeId: number,
  replyTo: number | null, // null = new top-level comment
  formData: FormData,
) {
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Write something first." };

  const access = await requireTripAccess(tripId);
  if (!(await isOnTrip(access, scope, scopeId))) return { error: "That has gone." };

  let parentId: number | null = null;
  if (replyTo !== null) {
    // undefined = target has gone; null = top level.
    const resolved = await resolveParent({ tripId: access.trip.id, scope, scopeId, replyTo });
    if (resolved === undefined) return { error: "That comment has gone." };
    parentId = resolved;
  }

  await insertNote({
    tripId: access.trip.id,
    createdBy: access.viewer.id,
    scope,
    scopeId,
    parentId,
    body,
  });

  refresh({ kind: "thread", tripId: access.trip.id, scope });
}

export async function react(
  tripId: number,
  noteId: number,
  kind: ReactionKind,
) {
  if (!REACTION_KINDS.includes(kind)) return;
  const access = await requireTripAccess(tripId);

  const target = await findNote(access.trip.id, noteId);
  if (!target) return;

  await toggleReaction(target.id, access.viewer.id, kind);

  refresh({ kind: "thread", tripId: access.trip.id, scope: target.scope });
}

export async function deleteNote(tripId: number, noteId: number) {
  const access = await requireTripAccess(tripId);
  const row = await findNote(access.trip.id, noteId);
  if (!row) return;

  if (row.createdBy !== access.viewer.id) return;

  await softDeleteNoteAndReplies(row.id);

  refresh({ kind: "thread", tripId: access.trip.id, scope: row.scope });
}
