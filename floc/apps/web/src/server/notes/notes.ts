import "server-only";

import { and, count, eq, isNull, or } from "drizzle-orm";

import { db } from "@/db";
import { comment, commentReaction } from "@/db/schema";
import type { CommentScope, ReactionKind } from "@/db/schema";
import { assertRoom } from "@/server/limits";
import { TEXT_CAPS } from "@floc/core/text/text";
import { tripHref, threadTab } from "@floc/core/notifications/notification-href";
import { touch } from "@/server/audit";
import { refresh } from "@/server/freshness";
import { recordActivity } from "@/server/notifications/activity";

export const NOTE_BODY_MAX = TEXT_CAPS.noteBody;

const GONE = "That comment has gone.";

export const subjectOf = (scope: CommentScope) => (scope === "page" ? comment.pageId : comment.dayEventId);

export async function findNote(tripId: number, noteId: number) {
  const row = await db
    .select({ id: comment.id, createdBy: comment.createdBy, pageId: comment.pageId, body: comment.body })
    .from(comment)
    .where(and(eq(comment.id, noteId), eq(comment.tripId, tripId), isNull(comment.deletedAt)))
    .get();
  if (!row) return undefined;
  const scope: CommentScope = row.pageId === null ? "day_event" : "page";
  return { id: row.id, createdBy: row.createdBy, scope, body: row.body };
}

export async function resolveParent(args: {
  tripId: number;
  scope: CommentScope;
  scopeId: number;
  replyTo: number;
}): Promise<number | null | undefined> {
  const target = await db
    .select({ id: comment.id, parentId: comment.parentId })
    .from(comment)
    .where(
      and(
        eq(comment.id, args.replyTo),
        eq(comment.tripId, args.tripId),
        eq(subjectOf(args.scope), args.scopeId),
        isNull(comment.deletedAt),
      ),
    )
    .get();
  if (!target) return undefined;
  return target.parentId ?? target.id;
}

export async function insertNote(args: {
  tripId: number;
  createdBy: string;
  scope: CommentScope;
  scopeId: number;
  parentId: number | null;
  body: string;
}): Promise<number> {
  const [{ n }] = await db
    .select({ n: count() })
    .from(comment)
    .where(and(eq(comment.tripId, args.tripId), eq(subjectOf(args.scope), args.scopeId), isNull(comment.deletedAt)));
  assertRoom("commentsPerThread", n);
  return db.transaction(async (tx) => {
    const row = await tx
      .insert(comment)
      .values({
        tripId: args.tripId,
        createdBy: args.createdBy,
        retiredScope: args.scope,
        retiredScopeId: args.scopeId,
        dayEventId: args.scope === "day_event" ? args.scopeId : null,
        pageId: args.scope === "page" ? args.scopeId : null,
        parentId: args.parentId,
        body: args.body.slice(0, NOTE_BODY_MAX),
      })
      .returning({ id: comment.id })
      .get();
    const parent =
      args.parentId === null
        ? undefined
        : await tx.select({ createdBy: comment.createdBy }).from(comment).where(eq(comment.id, args.parentId)).get();

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
    .update(comment)
    .set({ body: body.slice(0, NOTE_BODY_MAX), editedAt: new Date(), ...touch() })
    .where(and(eq(comment.id, noteId), isNull(comment.deletedAt)));
}

export async function softDeleteNoteAndReplies(noteId: number): Promise<void> {
  await db
    .update(comment)
    .set({ deletedAt: new Date(), ...touch() })
    .where(and(or(eq(comment.id, noteId), eq(comment.parentId, noteId)), isNull(comment.deletedAt)));
}

export async function toggleReaction(
  noteId: number,
  userId: string,
  kind: ReactionKind,
): Promise<void> {
  const existing = await db
    .select({ deletedAt: commentReaction.deletedAt })
    .from(commentReaction)
    .where(
      and(
        eq(commentReaction.commentId, noteId),
        eq(commentReaction.userId, userId),
        eq(commentReaction.kind, kind),
      ),
    )
    .get();

  const deletedAt = existing?.deletedAt ? null : existing ? new Date() : null;

  await db
    .insert(commentReaction)
    .values({ commentId: noteId, userId, kind, deletedAt })
    .onConflictDoUpdate({
      target: [commentReaction.commentId, commentReaction.userId, commentReaction.kind],
      set: { deletedAt, ...touch() },
    });
}

export async function addThreadNote(args: {
  tripId: number;
  viewerId: string;
  scope: CommentScope;
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
