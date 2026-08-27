/**
 * `note` + `note_reaction` write half (ticket 108); reads are in
 * `server/notes-read.ts` — one aggregate split by direction, not by table.
 *
 * Threads go through the polymorphic `note` table (scope + scope_id) rather
 * than a table per surface, since a note on an idea and one on a day event are
 * the same object with the same rules.
 *
 * Owns: soft-delete (rule 8) including the reaction toggle's revive-not-insert
 * behaviour; one-level-deep threading (ticket 06, split across `resolveParent`
 * and `softDeleteNoteAndReplies`); the body cap; and per-scope revalidation.
 */
import "server-only";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { note, noteReaction } from "@/db/schema";
import type { NoteScope, ReactionKind } from "@/db/schema";
import { TEXT_CAPS } from "@/lib/text";
import { touch } from "@/server/audit";

/** Re-exported from `lib/text.ts` (ticket 113) — predates the others' move there. */
export const NOTE_BODY_MAX = TEXT_CAPS.noteBody;

/** Revalidates the tab a scope is rendered on — the layout path alone doesn't refresh the page's own router cache. */
export function revalidateThread(tripId: number, scope: NoteScope): void {
  revalidatePath(pathFor(tripId, scope));
}

function pathFor(tripId: number, scope: NoteScope): string {
  switch (scope) {
    case "idea":
      return `/trip/${tripId}/notes`;
    case "day_event":
    case "day":
      return `/trip/${tripId}/days`;
    case "expense":
      return `/trip/${tripId}/money`;
    case "trip":
      return `/trip/${tripId}/overview`;
  }
}

/** One live note of this trip's. Scoped by trip, so a foreign id reads as gone. */
export async function findNote(tripId: number, noteId: number) {
  return db
    .select({ id: note.id, createdBy: note.createdBy, scope: note.scope, body: note.body })
    .from(note)
    .where(and(eq(note.id, noteId), eq(note.tripId, tripId), isNull(note.deletedAt)))
    .get();
}

/**
 * The parent a reply should attach to. Threads are one level deep (ticket 06),
 * so replying to a reply attaches to that reply's own parent. Target is
 * re-read here rather than trusted from the form, which also stops a crafted
 * `replyTo` pointing at another trip's comment. `undefined` means the target
 * has gone — distinct from `null` ("attach at the top level").
 */
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
}): Promise<void> {
  await db.insert(note).values({ ...args, body: args.body.slice(0, NOTE_BODY_MAX) });
}

export async function updateNoteBody(noteId: number, body: string): Promise<void> {
  await db
    .update(note)
    .set({ body: body.slice(0, NOTE_BODY_MAX), editedAt: new Date(), ...touch() })
    .where(and(eq(note.id, noteId), isNull(note.deletedAt)));
}

/** Soft-deletes a comment and its replies in the same stamp — one level deep means no recursion, and a reply left orphaned answers nothing. */
export async function softDeleteNoteAndReplies(noteId: number): Promise<void> {
  const deletedAt = new Date();
  await db
    .update(note)
    .set({ deletedAt, ...touch() })
    .where(and(eq(note.id, noteId), isNull(note.deletedAt)));
  await db
    .update(note)
    .set({ deletedAt, ...touch() })
    .where(and(eq(note.parentId, noteId), isNull(note.deletedAt)));
}

/**
 * Toggles one of the three reactions — independent of each other by design
 * (ticket 06), a comment can be both hearted and agreed with.
 *
 * Soft-delete (rule 8) means un-reacting revives the same row rather than
 * inserting a second one. Used to be a read-modify-write with a non-unique
 * index behind it, so two taps landing together double-counted one person's
 * heart (ticket 115); `note_reaction_one_idx` is unique now, turning this into
 * an upsert that can't duplicate. The read stays only to decide which way to
 * flip — a genuine race just settles last-write-wins (rule 7) on one row.
 */
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
