/**
 * Reading discussion threads — shared by every surface that has one.
 *
 * Both callers (Ideas and Days) were running the same join by hand and then
 * grouping it by hand, which is how the two drifted apart once replies and
 * reactions arrived. One reader, two callers (v0.2 ticket 06).
 *
 * Server only. The shape and the timestamp formatting live in `lib/notes.ts`,
 * which the Client Component imports.
 *
 * Threads are exactly one level deep, so this assembles the tree in two
 * passes and never recurses.
 */
import { and, asc, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { note, noteReaction, user, userProfile, type NoteScope } from "@/db/schema";
import { emptyReactions, type NoteRow, type Reactions } from "@/lib/notes";

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

  /*
   * Scoped by trip and scope, NOT by a list of ids the caller has just
   * fetched. That list is what made this a *serial* read — Ideas and Days both
   * had to wait for their own rows to come back before the threads could even
   * be requested, which was the third round trip on the two busiest tabs.
   * `(trip_id, scope)` is the same bound in practice: it is the leading pair of
   * the `note_scope_idx` index, and a trip's notes for one scope are exactly
   * the notes its page can display. The only extra rows are threads hanging
   * off a soft-deleted idea or event, which the caller never looks up and
   * drops on the floor.
   *
   * Both reads share that scope, so the reactions no longer wait on the note
   * ids either — they join through `note` and re-apply it.
   */
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
        authorAvatar: userProfile.avatarUrl,
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
      authorAvatar: r.authorAvatar,
      authorTone: toneOf.get(r.createdBy),
      reactions: reactionsByNote.get(r.id) ?? emptyReactions(),
      replies: [],
    });
  }

  /**
   * A run's position is its *parent's* time, not its latest reply's: a thread
   * is an argument you follow from the start, so a two-week-old comment that
   * picked up a reply this morning stays where it was rather than jumping the
   * queue and reordering the thread under you between visits.
   *
   * Both passes walk `rows`, which is already oldest-first, so both the runs
   * and the replies inside them come out in order without a second sort.
   */
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

