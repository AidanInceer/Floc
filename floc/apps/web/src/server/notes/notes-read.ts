/**
 * Reading discussion threads — shared by every surface that has one. Days and
 * Days used to run and group the same join by hand, which is how they drifted
 * apart once replies and reactions arrived; one reader, two callers now
 * (ticket 06). Shape/formatting for the Client Component lives in
 * `lib/notes.ts`. Threads are one level deep, so this assembles the tree in
 * two passes and never recurses.
 */
import "server-only";

import { and, asc, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { note, noteReaction, user, userProfile, type NoteScope } from "@/db/schema";
import { emptyReactions, type NoteRow, type Reactions } from "@floc/core/notes/notes";

export async function loadThreads({
  tripId,
  scope,
  viewerId,
  toneOf,
}: {
  tripId: number;
  scope: NoteScope;
  viewerId: string;
  /** Trip roster tones, so one person is one colour across every tab. */
  toneOf: Map<string, string | undefined>;
}): Promise<Map<number, NoteRow[]>> {
  const byScope = new Map<number, NoteRow[]>();

  // Scoped by (trip_id, scope), not a list of ids the caller just fetched —
  // that made this a serial read, the third round trip on the busiest tabs.
  // (trip_id, scope) leads the note_scope_idx index and matches what a page
  // can display; extra rows from a soft-deleted day/event are just dropped.
  // Reactions join through `note` and reuse the same scope, so they don't
  // wait on note ids either.
  const scoped = and(
    eq(note.tripId, tripId),
    eq(note.scope, scope),
    isNull(note.deletedAt),
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

  // A run's position is its parent's time, not its latest reply's — a
  // two-week-old comment with a fresh reply shouldn't jump the queue. Both
  // passes walk `rows`, already oldest-first, so no second sort is needed.
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

