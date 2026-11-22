import "server-only";

import { and, count, eq, isNull, or } from "drizzle-orm";

import { db } from "@/db";
import { note, noteReaction } from "@/db/schema";
import type { NoteScope, ReactionKind } from "@/db/schema";
import { assertRoom } from "@/server/limits";
import { TEXT_CAPS } from "@floc/core/text/text";
import { tripHref, threadTab } from "@floc/core/notifications/notification-href";
import { touch } from "@/server/audit";
import { refresh } from "@/server/freshness";
import { recordActivity } from "@/server/notifications/activity";

export const NOTE_BODY_MAX = TEXT_CAPS.noteBody;

const GONE = "That comment has gone.";

export async function findNote(tripId: number, noteId: number) {
  return db
    .select({ id: note.id, createdBy: note.createdBy, scope: note.scope, body: note.body })
    .from(note)
    .where(and(eq(note.id, noteId), eq(note.tripId, tripId), isNull(note.deletedAt)))
    .get();
}

export async function resolveParent(args: {
  tripId: number;
  scope: NoteScope;
  scopeId: number;
  replyTo: number;
}): Promise<number | null | undefined> {
  const target = await db
    .select({ id: note.id, parentId: note.parentId })
    .from(note)
    .where(
      and(
        eq(note.id, args.replyTo),
        eq(note.tripId, args.tripId),
        eq(note.scope, args.scope),
        eq(note.scopeId, args.scopeId),
        isNull(note.deletedAt),
      ),
    )
    .get();
  if (!target) return undefined;
  return target.parentId ?? target.id;
}

export async function insertNote(args: {
  tripId: number;
  createdBy: string;
  scope: NoteScope;
  scopeId: number;
  parentId: number | null;
  body: string;
}): Promise<number> {
  const [{ n }] = await db
    .select({ n: count() })
    .from(note)
    .where(and(eq(note.tripId, args.tripId), eq(note.scope, args.scope), eq(note.scopeId, args.scopeId), isNull(note.deletedAt)));
  assertRoom("commentsPerThread", n);
  return db.transaction(async (tx) => {
    const row = await tx
      .insert(note)
      .values({ ...args, body: args.body.slice(0, NOTE_BODY_MAX) })
      .returning({ id: note.id })
      .get();
    const parent =
      args.parentId === null
        ? undefined
        : await tx.select({ createdBy: note.createdBy }).from(note).where(eq(note.id, args.parentId)).get();

    await recordActivity(tx, {
      kind: parent ? "comment_replied" : "comment_added",
      tripId: args.tripId,
      actorId: args.createdBy,
      subjectId: row.id,
      href: tripHref(args.tripId, threadTab(args.scope)),
      affected: parent ? [parent.createdBy] : [],
    });
    return row.id;
  });
}

export async function updateNoteBody(noteId: number, body: string): Promise<void> {
  await db
    .update(note)
    .set({ body: body.slice(0, NOTE_BODY_MAX), editedAt: new Date(), ...touch() })
    .where(and(eq(note.id, noteId), isNull(note.deletedAt)));
}

export async function softDeleteNoteAndReplies(noteId: number): Promise<void> {
  await db
    .update(note)
    .set({ deletedAt: new Date(), ...touch() })
    .where(and(or(eq(note.id, noteId), eq(note.parentId, noteId)), isNull(note.deletedAt)));
}

export async function toggleReaction(
  noteId: number,
  userId: string,
  kind: ReactionKind,
): Promise<void> {
  const existing = await db
    .select({ deletedAt: noteReaction.deletedAt })
    .from(noteReaction)
    .where(
      and(
        eq(noteReaction.noteId, noteId),
        eq(noteReaction.userId, userId),
        eq(noteReaction.kind, kind),
      ),
    )
    .get();

  const deletedAt = existing?.deletedAt ? null : existing ? new Date() : null;

  await db
    .insert(noteReaction)
    .values({ noteId, userId, kind, deletedAt })
    .onConflictDoUpdate({
      target: [noteReaction.noteId, noteReaction.userId, noteReaction.kind],
      set: { deletedAt, ...touch() },
    });
}

export async function addThreadNote(args: {
  tripId: number;
  viewerId: string;
  scope: NoteScope;
  scopeId: number;
  replyTo: number | null;
  body: string;
}): Promise<string | null> {
  const { tripId, scope, scopeId, replyTo } = args;
  let parentId: number | null = null;
  if (replyTo !== null) {
    const resolved = await resolveParent({ tripId, scope, scopeId, replyTo });
    if (resolved === undefined) return GONE;
    parentId = resolved;
  }

  await insertNote({ tripId, createdBy: args.viewerId, scope, scopeId, parentId, body: args.body });
  refresh({ kind: "thread", tripId, scope });
  return null;
}

export async function editOwnNote(tripId: number, viewerId: string, noteId: number, body: string): Promise<string | null> {
  const row = await findNote(tripId, noteId);
  if (!row) return GONE;
  if (row.createdBy !== viewerId) return "You can only edit your own comments.";

  if (body.slice(0, NOTE_BODY_MAX) === row.body) return null;

  await updateNoteBody(row.id, body);
  refresh({ kind: "thread", tripId, scope: row.scope });
  return null;
}

export async function deleteOwnNote(tripId: number, viewerId: string, noteId: number): Promise<"forbidden" | null> {
  const row = await findNote(tripId, noteId);
  if (!row) return null;
  if (row.createdBy !== viewerId) return "forbidden";

  await softDeleteNoteAndReplies(row.id);
  refresh({ kind: "thread", tripId, scope: row.scope });
  return null;
}

export async function reactToNote(tripId: number, viewerId: string, noteId: number, kind: ReactionKind): Promise<void> {
  const row = await findNote(tripId, noteId);
  if (!row) return;

  await toggleReaction(row.id, viewerId, kind);
  refresh({ kind: "thread", tripId, scope: row.scope });
}
