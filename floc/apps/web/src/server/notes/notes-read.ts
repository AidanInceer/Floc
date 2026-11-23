import "server-only";

import { and, asc, count, eq, isNotNull, isNull } from "drizzle-orm";

import { db } from "@/db";
import { comment, commentReaction, user, userProfile, type CommentScope } from "@/db/schema";
import { emptyReactions, type NoteRow, type Reactions } from "@floc/core/notes/notes";

import { subjectOf } from "./notes";

export async function eventCommentCounts(tripId: number): Promise<Map<number, number>> {
  const rows = await db.select({ scopeId: comment.dayEventId, count: count() }).from(comment)
    .where(and(eq(comment.tripId, tripId), isNotNull(comment.dayEventId), isNull(comment.deletedAt), isNull(comment.resolvedAt)))
    .groupBy(comment.dayEventId).all();
  return new Map(rows.flatMap((row) => row.scopeId === null ? [] : [[row.scopeId, row.count]]));
}

export async function loadThreads({
  tripId,
  scope,
  viewerId,
  toneOf,
  scopeId,
}: {
  tripId: number;
  scope: CommentScope;
  viewerId: string;
  toneOf: Map<string, string | undefined>;
  scopeId?: number;
}): Promise<Map<number, NoteRow[]>> {
  const byScope = new Map<number, NoteRow[]>();
  const subject = subjectOf(scope);

  const scoped = and(
    eq(comment.tripId, tripId),
    scopeId === undefined ? isNotNull(subject) : eq(subject, scopeId),
    isNull(comment.deletedAt),
    isNull(comment.resolvedAt),
  );

  const [rows, reactionRows] = await Promise.all([
    db
      .select({
        id: comment.id,
        scopeId: subject,
        parentId: comment.parentId,
        body: comment.body,
        createdAt: comment.createdAt,
        editedAt: comment.editedAt,
        createdBy: comment.createdBy,
        authorName: user.name,
        authorAvatarIcon: userProfile.avatarIcon,
      })
      .from(comment)
      .innerJoin(user, eq(user.id, comment.createdBy))
      .leftJoin(userProfile, eq(userProfile.userId, comment.createdBy))
      .where(scoped)
      .orderBy(asc(comment.createdAt))
      .all(),
    db
      .select({
        noteId: commentReaction.commentId,
        userId: commentReaction.userId,
        kind: commentReaction.kind,
      })
      .from(commentReaction)
      .innerJoin(comment, eq(comment.id, commentReaction.commentId))
      .where(and(scoped, isNull(commentReaction.deletedAt)))
      .all(),
  ]);

  if (rows.length === 0) return byScope;

  const reactionsByNote = new Map<number, Reactions>();
  for (const r of reactionRows) {
    const tally = reactionsByNote.get(r.noteId) ?? emptyReactions();
    tally[r.kind].count += 1;
    if (r.userId === viewerId) tally[r.kind].mine = true;
    reactionsByNote.set(r.noteId, tally);
  }

  const nodes = new Map<number, NoteRow>();
  for (const r of rows) {
    nodes.set(r.id, {
      id: r.id,
      body: r.body,
      createdAt: r.createdAt,
      editedAt: r.editedAt,
      createdBy: r.createdBy,
      authorName: r.authorName,
      authorAvatarIcon: r.authorAvatarIcon,
      authorTone: toneOf.get(r.createdBy),
      reactions: reactionsByNote.get(r.id) ?? emptyReactions(),
      replies: [],
    });
  }

  for (const r of rows) {
    if (r.parentId === null) continue;
    nodes.get(r.parentId)?.replies.push(nodes.get(r.id)!);
  }
  for (const r of rows) {
    if (r.parentId !== null || r.scopeId === null) continue;
    const list = byScope.get(r.scopeId) ?? [];
    list.push(nodes.get(r.id)!);
    byScope.set(r.scopeId, list);
  }

  return byScope;
}
