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
import { and, asc, eq, inArray, isNull } from "drizzle-orm";

import { db } from "@/db";
import { note, noteReaction, user, userProfile, type NoteScope } from "@/db/schema";
import { emptyReactions, type NoteRow, type Reactions } from "@/lib/notes";

export async function loadThreads({
  tripId,
  scope,
  scopeIds,
  viewerId,
  toneOf,
}: {
  tripId: number;
  scope: NoteScope;
  /** The ids on this page. Never read the scope unbounded. */
  scopeIds: number[];
  viewerId: string;
  /** Trip roster tones, so one person is one colour across every tab. */
  toneOf: Map<string, string | undefined>;
}): Promise<Map<number, NoteRow[]>> {
  const byScope = new Map<number, NoteRow[]>();
  if (scopeIds.length === 0) return byScope;

  const rows = await db
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
    .where(
      and(
        eq(note.tripId, tripId),
        eq(note.scope, scope),
        inArray(note.scopeId, scopeIds),
        isNull(note.deletedAt),
      ),
    )
    .orderBy(asc(note.createdAt))
    .all();

  if (rows.length === 0) return byScope;

  const reactionRows = await db
    .select({
      noteId: noteReaction.noteId,
      userId: noteReaction.userId,
      kind: noteReaction.kind,
    })
    .from(noteReaction)
    .where(
      and(
        inArray(
          noteReaction.noteId,
          rows.map((r) => r.id),
        ),
        isNull(noteReaction.deletedAt),
      ),
    )
    .all();

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

