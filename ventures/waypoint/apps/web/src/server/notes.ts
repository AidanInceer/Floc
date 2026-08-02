/**
 * The notes aggregate's write half — `note` and `note_reaction` (ticket 108).
 * The read half is `server/notes-read.ts`, which assembles whole threads for a
 * page; the two are one aggregate split by direction, not by table.
 *
 * Discussion threads go through the polymorphic `note` table (scope +
 * scope_id) rather than a table per surface: a note on an idea and a note on a
 * day event are the same object with the same rules, and the alternative is
 * `idea_comment`, `day_event_comment`, … each with its own read, action and
 * component. Nothing in here is scope-specific, which is the sign it was the
 * right table.
 *
 * The rules it owns:
 *
 * - **Soft-delete (rule 8)** on every read, and the reaction toggle, where
 *   un-reacting must revive the same row rather than insert a second one.
 * - **One level deep** (ticket 06): a reply attaches to its target's parent, and
 *   deleting a parent takes its replies. `resolveParent` and
 *   `softDeleteNoteAndReplies` are the two halves of that, and being here means
 *   no caller can implement half of it.
 * - **The body cap**, `NOTE_BODY_MAX`.
 * - **Revalidation**, including which tab a scope is rendered on — see
 *   `revalidateThread`.
 */
import "server-only";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { note, noteReaction } from "@/db/schema";
import type { NoteScope, ReactionKind } from "@/db/schema";
import { TEXT_CAPS } from "@/lib/text";
import { touch } from "@/server/unlocks";

/**
 * Longer than anyone types in a comment box, short enough to bound the row.
 * Re-exported from `lib/text.ts` (ticket 113), which is where every other
 * column's cap now lives — this one merely predates them.
 */
export const NOTE_BODY_MAX = TEXT_CAPS.noteBody;

/**
 * Revalidates the tab a scope is rendered on.
 *
 * Revalidating the layout alone left the tab you were looking at showing the
 * old thread until a manual reload — the client router cache for that page
 * isn't refreshed unless the revalidated path is the page's own. So name it.
 */
export function revalidateThread(tripId: number, scope: NoteScope): void {
  revalidatePath(pathFor(tripId, scope));
}

function pathFor(tripId: number, scope: NoteScope): string {
  switch (scope) {
    case "idea":
      return `/trip/${tripId}/ideas`;
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
 * The parent a reply should attach to. Threads are exactly one level deep
 * (ticket 06), so replying to a reply attaches to that reply's own parent — and
 * the target is re-read here rather than trusted from the form, which is also
 * what stops a crafted `replyTo` pointing at a comment in someone else's trip.
 *
 * Returns `undefined` when the target has gone, which the caller must tell
 * apart from `null` ("attach at the top level").
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

/**
 * Soft-deletes a comment and, in the same stamp, its replies.
 *
 * A reply is only legible under the comment it answers, so deleting a
 * top-level comment takes its replies with it rather than leaving them
 * stranded as top-level comments answering nothing. One level deep means this
 * needs no recursion. The confirm copy says so before it happens.
 */
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
 * Toggles one of the three reactions. They are independent of each other by
 * design (ticket 06) — a comment can be both hearted and agreed with, and
 * policing thumbs-up-plus-thumbs-down costs more than the case is worth.
 *
 * Soft-delete (rule 8) means un-reacting has to revive the same row rather than
 * insert a second one. This used to be a read-modify-write with a non-unique
 * index behind it, so two taps landing together wrote *two* rows and one
 * person's heart then counted as two (ticket 115). `note_reaction_one_idx` is
 * unique now, which turns the same intent into an upsert that cannot duplicate.
 *
 * The read stays, because the toggle has to know which way to flip. Under a
 * genuine race both readers may see the same state and write the same answer —
 * that is last-write-wins (rule 7), and it settles on one row rather than two,
 * which is the part that mattered.
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
