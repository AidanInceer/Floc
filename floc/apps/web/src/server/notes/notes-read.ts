import "server-only";

import { and, asc, count, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { note, noteReaction, user, userProfile, type NoteScope } from "@/db/schema";
import { emptyReactions, type NoteRow, type Reactions } from "@floc/core/notes/notes";

export async function eventCommentCounts(tripId: number): Promise<Map<number, number>> {
  const rows = await db.select({ scopeId: note.scopeId, count: count() }).from(note)
    .where(and(eq(note.tripId, tripId), eq(note.scope, "day_event"), isNull(note.deletedAt), isNull(note.resolvedAt)))
    .groupBy(note.scopeId).all();
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
  scope: NoteScope;
  viewerId: string;
  toneOf: Map<string, string | undefined>;
  scopeId?: number;
}): Promise<Map<number, NoteRow[]>> {
  const byScope = new Map<number, NoteRow[]>();

  const scoped = and(
    eq(note.tripId, tripId),
    eq(note.scope, scope),
    scopeId === undefined ? undefined : eq(note.scopeId, scopeId),
    isNull(note.deletedAt),
    isNull(note.resolvedAt),
  );

  const [rows, reactionRows] = await Promise.all([
    db
      .select({
        id: note.id,
        scopeId: note.scopeId,
        parentId: note.parentId,
        body: note.body,
        createdAt: note.createdAt,
        editedAt: note.editedAt,
        createdBy: note.createdBy,
        authorName: user.name,
        authorAvatarIcon: userProfile.avatarIcon,
      })
      .from(note)
      .innerJoin(user, eq(user.id, note.createdBy))
      .leftJoin(userProfile, eq(userProfile.userId, note.createdBy))
      .where(scoped)
      .orderBy(asc(note.createdAt))
      .all(),
    db
      .select({
        noteId: noteReaction.noteId,
        userId: noteReaction.userId,
        kind: noteReaction.kind,
      })
      .from(noteReaction)
      .innerJoin(note, eq(note.id, noteReaction.noteId))
      .where(and(scoped, isNull(noteReaction.deletedAt)))
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

